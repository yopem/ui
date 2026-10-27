import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import * as Y from "yjs"
import { z } from "zod"

import { mapSerial } from "#serial-iteration"

import type { EditorIdentity } from "./auth"
import type {
  CollaborationContext,
  CollaborationTransactions,
} from "./collaboration-postgres"
import type { createPostgresCollaborationLog } from "./collaboration-postgres"
import type {
  EditorCollaborationGrant,
  EditorCollaborationTicketStore,
} from "./collaboration-tickets"

import { preflightUpdate } from "./collaboration/preflight"
import {
  CollaborationError,
  collaborationLimits,
  decodeFrame,
  syncFrame,
  validateAwareness,
  awarenessFrame,
  candidateState,
} from "./collaboration/protocol"

export interface EditorCollaborationSocket {
  send(value: string | Uint8Array): void
  close(code: number, reason: string): void
  readonly bufferedAmount?: number
}

export interface EditorCollaborationRevalidation {
  documentId: string
  generation: string
  identity: EditorIdentity
  permission: "read" | "write"
  credentialExpiresAt: number
  signal: AbortSignal
}

export interface EditorCollaborationSessionHandler {
  open(
    grant: EditorCollaborationGrant,
    socket: EditorCollaborationSocket,
  ): Promise<void>
  message(
    socket: EditorCollaborationSocket,
    data: string | ArrayBuffer | Uint8Array,
  ): Promise<void>
  close(socket: EditorCollaborationSocket): Promise<void>
  error(socket: EditorCollaborationSocket): Promise<void>
}

export interface EditorCollaborationSessionOptions {
  log: ReturnType<typeof createPostgresCollaborationLog>
  tickets: EditorCollaborationTicketStore
  transactions: CollaborationTransactions
  timeoutMs: number
  pollIntervalMs: number
  leaseMs?: number
  pendingDeliveryMs?: number
  revalidate(input: EditorCollaborationRevalidation): Promise<boolean>
}

type Outgoing =
  | { kind: "state" }
  | { kind: "vector"; stateVector: Uint8Array }
  | { kind: "awareness"; payload: Uint8Array }

interface Connection {
  grant: EditorCollaborationGrant
  socket: EditorCollaborationSocket
  clientId: number
  leaseId: string
  state: Uint8Array
  revision: string
  presenceRevision: string
  presenceClock: number
  presencePayload: Uint8Array | null
  presenceActive: boolean
  windowStartedAt: number
  frames: number
  sentBytes: number
  pending: { id: string; at: number } | null
  vectorRequested: boolean
  queue: Outgoing[]
  queuedBytes: number
  pollTimer: ReturnType<typeof setTimeout> | undefined
  polling: boolean
  pumping: boolean
  messageTail: Promise<void>
  queuedMessages: number
  queuedMessageBytes: number
  closed: boolean
}

const presenceSchema = z.strictObject({
  revision: z.union([z.string(), z.number()]),
  client_id: z.union([z.string(), z.number()]),
  clock: z.union([z.string(), z.number()]),
  payload: z.instanceof(Uint8Array),
  user_id: z.string().min(1).max(256),
  active: z.boolean(),
  expires_at: z.union([z.string(), z.number()]),
})

const ackSchema = z.strictObject({ ack: z.string().regex(/^[a-f0-9]{32}$/) })

const incomingMessageSchema = z
  .union([
    z
      .string()
      .max(64)
      .refine((value) => new TextEncoder().encode(value).byteLength <= 64),
    z
      .instanceof(Uint8Array)
      .refine((value) => value.byteLength <= collaborationLimits.frameBytes),
    z
      .instanceof(ArrayBuffer)
      .refine((value) => value.byteLength <= collaborationLimits.frameBytes),
  ])
  .transform(function parseIncomingMessage(value) {
    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      const bytes =
        value instanceof Uint8Array
          ? value.slice()
          : new Uint8Array(value.slice(0))

      return {
        kind: "binary" as const,
        value: bytes,
        byteLength: bytes.byteLength,
      }
    }

    return {
      kind: "ack" as const,
      value,
      byteLength: new TextEncoder().encode(value).byteLength,
    }
  })

type IncomingMessage = z.infer<typeof incomingMessageSchema>

const emptyVector = Uint8Array.of(0)

const tombstoneMs = 120000

const maxPresenceRows = 2048

function number(value: string | number, maximum = Number.MAX_SAFE_INTEGER) {
  const result = Number(value)

  if (!Number.isSafeInteger(result) || result < 0 || result > maximum)
    throw new CollaborationError("corrupt")

  return result
}

function randomToken(bytes = 16) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("")
}

function encodeAwareness(clientId: number, clock: number, state: null) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 1)
  encoding.writeVarUint(encoder, clientId)
  encoding.writeVarUint(encoder, clock)
  encoding.writeVarString(encoder, JSON.stringify(state))
  const result = encoding.toUint8Array(encoder)

  if (result.byteLength > collaborationLimits.awarenessBytes)
    throw new CollaborationError("budget")

  return result
}

function isRemoval(payload: Uint8Array) {
  const decoder = decoding.createDecoder(payload)
  decoding.readVarUint(decoder)
  decoding.readVarUint(decoder)
  decoding.readVarUint(decoder)

  return JSON.parse(decoding.readVarString(decoder)) === null
}

function context(grant: EditorCollaborationGrant, timeoutMs: number) {
  if (
    !Number.isSafeInteger(grant.credentialExpiresAt) ||
    grant.credentialExpiresAt <= Date.now()
  )
    throw new CollaborationError("denied")
  const controller = new AbortController()
  const deadline = Math.min(Date.now() + timeoutMs, grant.credentialExpiresAt)

  const timer = setTimeout(
    () => controller.abort(),
    Math.max(0, deadline - Date.now()),
  )

  return {
    value: {
      identity: grant.identity,
      credentialExpiresAt: grant.credentialExpiresAt,
      signal: controller.signal,
      deadline,
    } satisfies CollaborationContext,
    close() {
      clearTimeout(timer)
    },
  }
}

async function withContext<T>(
  grant: EditorCollaborationGrant,
  timeoutMs: number,
  work: (value: CollaborationContext) => Promise<T>,
) {
  const execution = context(grant, timeoutMs)

  try {
    return await work(execution.value)
  } finally {
    execution.close()
  }
}

export function createPostgresEditorCollaborationSessions(
  options: EditorCollaborationSessionOptions,
): EditorCollaborationSessionHandler {
  const leaseMs = options.leaseMs ?? 60000
  const pendingDeliveryMs = options.pendingDeliveryMs ?? 15000
  const connections = new WeakMap<EditorCollaborationSocket, Connection>()
  const active = new Set<Connection>()

  if (
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 30000 ||
    !Number.isSafeInteger(options.pollIntervalMs) ||
    options.pollIntervalMs < 10 ||
    options.pollIntervalMs > 60000 ||
    !Number.isSafeInteger(leaseMs) ||
    leaseMs < 1000 ||
    leaseMs > 60000 ||
    !Number.isSafeInteger(pendingDeliveryMs) ||
    pendingDeliveryMs < 1000 ||
    pendingDeliveryMs > 60000
  )
    throw new CollaborationError("invalid")

  function check(connection: Connection) {
    if (connection.closed || connection.grant.credentialExpiresAt <= Date.now())
      throw new CollaborationError("denied")
  }

  async function load(connection: Connection) {
    check(connection)
    const execution = context(connection.grant, options.timeoutMs)

    try {
      const decision = await options.revalidate({
        documentId: connection.grant.documentId,
        generation: connection.grant.generation,
        identity: connection.grant.identity,
        permission: connection.grant.permission,
        credentialExpiresAt: connection.grant.credentialExpiresAt,
        signal: execution.value.signal,
      })

      if (decision !== true) throw new CollaborationError("denied")
      check(connection)

      const head = await options.log.load(
        connection.grant.documentId,
        execution.value,
      )

      check(connection)

      if (head.generation !== connection.grant.generation)
        throw new CollaborationError("conflict")

      return head
    } finally {
      execution.close()
    }
  }

  async function runQuery<T>(
    grant: EditorCollaborationGrant,
    work: (
      query: (
        text: string,
        values: (string | Uint8Array)[],
      ) => Promise<unknown[]>,
    ) => Promise<T>,
  ) {
    const execution = context(grant, options.timeoutMs)

    try {
      return await options.transactions.run(
        execution.value.signal,
        execution.value.deadline,
        work,
      )
    } catch (error) {
      if (error instanceof CollaborationError) throw error
      throw new CollaborationError(
        execution.value.signal.aborted ? "aborted" : "unavailable",
      )
    } finally {
      execution.close()
    }
  }

  async function savePresence(
    connection: Connection,
    clock: number,
    payload: Uint8Array,
    isActive: boolean,
    expiresAt: number,
  ) {
    return await runQuery(connection.grant, async (query) => {
      const leases = await query(
        "SELECT lease_id FROM editor_collaboration_clients WHERE lease_id=$1 AND document_id=$2 AND generation=$3 AND client_id=$4 AND expires_at>$5",
        [
          connection.leaseId,
          connection.grant.documentId,
          connection.grant.generation,
          String(connection.clientId),
          String(Date.now()),
        ],
      )

      if (leases.length !== 1) throw new CollaborationError("denied")

      const existing = await query(
        "SELECT client_id FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2 AND client_id=$3",
        [
          connection.grant.documentId,
          connection.grant.generation,
          String(connection.clientId),
        ],
      )

      if (existing.length === 0) {
        const counts = await query(
          "SELECT count(*)::text AS count FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2 AND expires_at>$3",
          [
            connection.grant.documentId,
            connection.grant.generation,
            String(Date.now()),
          ],
        )

        const count = z
          .strictObject({ count: z.string().regex(/^[0-9]+$/) })
          .parse(counts[0])

        if (BigInt(count.count) >= BigInt(maxPresenceRows))
          throw new CollaborationError("budget")
      }

      const rows = await query(
        "INSERT INTO editor_collaboration_presence(document_id,generation,client_id,lease_id,user_id,clock,payload,active,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(document_id,generation,client_id) DO UPDATE SET lease_id=EXCLUDED.lease_id,user_id=EXCLUDED.user_id,clock=EXCLUDED.clock,payload=EXCLUDED.payload,active=EXCLUDED.active,revision=nextval('editor_collaboration_presence_revision_seq'),expires_at=EXCLUDED.expires_at WHERE editor_collaboration_presence.lease_id=EXCLUDED.lease_id OR EXCLUDED.clock>editor_collaboration_presence.clock RETURNING revision::text",
        [
          connection.grant.documentId,
          connection.grant.generation,
          String(connection.clientId),
          connection.leaseId,
          connection.grant.identity.userId,
          String(clock),
          payload,
          String(isActive),
          String(expiresAt),
        ],
      )

      if (rows.length !== 1) throw new CollaborationError("conflict")

      return z
        .strictObject({ revision: z.string().regex(/^[0-9]+$/) })
        .parse(rows[0]).revision
    })
  }

  async function renewPresence(connection: Connection) {
    if (!connection.presenceActive || !connection.presencePayload) return

    const expiresAt = Math.min(
      connection.grant.credentialExpiresAt,
      Date.now() + 30000,
    )

    await runQuery(connection.grant, async (query) => {
      const rows = await query(
        "UPDATE editor_collaboration_presence SET expires_at=$4 WHERE document_id=$1 AND generation=$2 AND client_id=$3 AND lease_id=$5 AND active=TRUE RETURNING client_id",
        [
          connection.grant.documentId,
          connection.grant.generation,
          String(connection.clientId),
          String(expiresAt),
          connection.leaseId,
        ],
      )

      if (rows.length !== 1) throw new CollaborationError("denied")
    })
  }

  async function presenceHead(connection: Connection) {
    return await runQuery(connection.grant, async (query) => {
      const rows = await query(
        "SELECT COALESCE(MAX(revision),0)::text AS revision FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2",
        [connection.grant.documentId, connection.grant.generation],
      )

      return z
        .strictObject({ revision: z.string().regex(/^[0-9]+$/) })
        .parse(rows[0]).revision
    })
  }

  async function initialPresence(connection: Connection, head: string) {
    const rows = await runQuery(connection.grant, (query) =>
      query(
        "SELECT revision::text,client_id::text,clock::text,payload,user_id,active,expires_at::text FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2 AND active=TRUE AND expires_at>$3 AND revision<=$4 ORDER BY revision LIMIT 32",
        [
          connection.grant.documentId,
          connection.grant.generation,
          String(Date.now()),
          head,
        ],
      ),
    )

    connection.presenceRevision = head

    return rows.map((row) => {
      const value = presenceSchema.parse(row)

      return {
        revision: String(value.revision),
        clientId: number(value.client_id, 4294967295),
        clock: number(value.clock, 4294967295),
        payload: validateAwareness(value.payload, {
          clientId: number(value.client_id, 4294967295),
          clock: Math.max(0, number(value.clock, 4294967295) - 1),
          user: { id: value.user_id, name: value.user_id.slice(0, 128) },
        }).payload,
        active: value.active,
        expiresAt: number(value.expires_at),
      }
    })
  }

  async function expirePresence(connection: Connection) {
    const expired = await runQuery(connection.grant, (query) =>
      query(
        "SELECT client_id::text,lease_id,clock::text FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2 AND active=TRUE AND expires_at<=$3 ORDER BY expires_at LIMIT 32",
        [
          connection.grant.documentId,
          connection.grant.generation,
          String(Date.now()),
        ],
      ),
    )

    const rows = expired.map((row) =>
      z
        .strictObject({
          client_id: z.string().regex(/^[0-9]+$/),
          lease_id: z.string().regex(/^[a-f0-9]{32}$/),
          clock: z.string().regex(/^[0-9]+$/),
        })
        .parse(row),
    )

    for await (const updated of mapSerial(rows, async function expireRow(row) {
      const clientId = number(row.client_id, 4294967295)
      const clock = Math.min(number(row.clock, 4294967295) + 1, 4294967295)
      const payload = encodeAwareness(clientId, clock, null)

      return await runQuery(connection.grant, (query) =>
        query(
          "UPDATE editor_collaboration_presence SET clock=$5,payload=$6,active=FALSE,revision=nextval('editor_collaboration_presence_revision_seq'),expires_at=$7 WHERE document_id=$1 AND generation=$2 AND client_id=$3 AND lease_id=$4 AND active=TRUE AND clock=$8 AND expires_at<=$9 RETURNING revision::text",
          [
            connection.grant.documentId,
            connection.grant.generation,
            row.client_id,
            row.lease_id,
            String(clock),
            payload,
            String(Date.now() + tombstoneMs),
            row.clock,
            String(Date.now()),
          ],
        ),
      )
    })) {
      if (updated.length > 1) throw new CollaborationError("corrupt")
    }

    await runQuery(connection.grant, (query) =>
      query(
        "DELETE FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2 AND active=FALSE AND expires_at<=$3",
        [
          connection.grant.documentId,
          connection.grant.generation,
          String(Date.now()),
        ],
      ),
    )
  }

  function queued(connection: Connection, item: Outgoing) {
    if (connection.queue.length >= 32) throw new CollaborationError("budget")

    if (item.kind !== "state") {
      connection.queuedBytes +=
        item.kind === "awareness"
          ? item.payload.byteLength
          : item.stateVector.byteLength

      if (connection.queuedBytes > 1048576)
        throw new CollaborationError("budget")
    }

    connection.queue.push(item)
  }

  function queueAwareness(connection: Connection, payload: Uint8Array) {
    for (const recipient of active) {
      if (
        recipient.closed ||
        recipient.grant.documentId !== connection.grant.documentId ||
        recipient.grant.generation !== connection.grant.generation ||
        recipient.clientId === connection.clientId
      )
        continue

      try {
        queued(recipient, { kind: "awareness", payload: payload.slice() })
        void pump(recipient).catch((cause: unknown) => fail(recipient, cause))
      } catch (error) {
        fail(recipient, error)
      }
    }
  }

  function queueState(connection: Connection) {
    for (const recipient of active) {
      if (
        recipient.closed ||
        recipient.grant.documentId !== connection.grant.documentId ||
        recipient.grant.generation !== connection.grant.generation
      )
        continue
      const existing = recipient.queue.some((item) => item.kind === "state")

      try {
        if (!existing) queued(recipient, { kind: "state" })
        void pump(recipient).catch((cause: unknown) => fail(recipient, cause))
      } catch (error) {
        fail(recipient, error)
      }
    }
  }

  async function deliver(connection: Connection, item: Outgoing) {
    const head = await load(connection)
    let bytes: Uint8Array

    if (item.kind === "state") {
      connection.state = head.state.slice()
      connection.revision = head.revision
      bytes = syncFrame(head.state, emptyVector)
    } else if (item.kind === "vector") {
      bytes = syncFrame(head.state, item.stateVector)
    } else {
      bytes = awarenessFrame(item.payload)
    }

    if (bytes.byteLength > collaborationLimits.frameBytes)
      throw new CollaborationError("budget")
    const buffered = connection.socket.bufferedAmount ?? 0
    const id = randomToken()
    const control = JSON.stringify({ delivery: id })

    if (
      !Number.isSafeInteger(buffered) ||
      buffered < 0 ||
      buffered + bytes.byteLength + control.length > 1048576
    )
      throw new CollaborationError("budget")

    connection.socket.send(bytes)
    connection.socket.send(control)
    connection.pending = { id, at: Date.now() }
  }

  async function pump(connection: Connection) {
    if (connection.pumping) return
    connection.pumping = true

    try {
      check(connection)

      if (
        !connection.vectorRequested ||
        connection.pending ||
        connection.queue.length === 0
      )
        return
      const item = connection.queue.shift()

      if (!item) return

      if (item.kind !== "state")
        connection.queuedBytes -=
          item.kind === "awareness"
            ? item.payload.byteLength
            : item.stateVector.byteLength
      await deliver(connection, item)
    } finally {
      connection.pumping = false
    }
  }

  async function revalidateLease(connection: Connection) {
    check(connection)

    const expiresAt = Math.min(
      connection.grant.credentialExpiresAt,
      Date.now() + leaseMs,
    )

    const renewed = await options.tickets.renewClient(
      connection.leaseId,
      expiresAt,
    )

    if (!renewed) throw new CollaborationError("denied")
    await renewPresence(connection)
  }

  async function pollPresence(connection: Connection) {
    const rows = await runQuery(connection.grant, (query) =>
      query(
        "SELECT revision::text,client_id::text,clock::text,payload,user_id,active,expires_at::text FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2 AND revision>$3 ORDER BY revision LIMIT 32",
        [
          connection.grant.documentId,
          connection.grant.generation,
          connection.presenceRevision,
        ],
      ),
    )

    for (const row of rows) {
      const value = presenceSchema.parse(row)

      const entry = {
        revision: String(value.revision),
        clientId: number(value.client_id, 4294967295),
        clock: number(value.clock, 4294967295),
        payload: value.payload.slice(),
        userId: value.user_id,
        active: value.active,
        expiresAt: number(value.expires_at),
      }

      connection.presenceRevision = entry.revision

      if (entry.active && entry.expiresAt <= Date.now()) continue

      const payload = validateAwareness(entry.payload, {
        clientId: entry.clientId,
        clock: Math.max(0, entry.clock - 1),
        user: { id: entry.userId, name: entry.userId.slice(0, 128) },
      }).payload

      queued(connection, { kind: "awareness", payload })
    }
  }

  async function poll(connection: Connection) {
    if (connection.closed || connection.polling) return
    connection.polling = true

    try {
      check(connection)

      if (
        connection.pending &&
        connection.pending.at + pendingDeliveryMs <= Date.now()
      )
        throw new CollaborationError("budget")
      await revalidateLease(connection)
      await load(connection)

      const updates = await withContext(
        connection.grant,
        options.timeoutMs,
        (value) =>
          options.log.poll(
            {
              documentId: connection.grant.documentId,
              generation: connection.grant.generation,
              afterRevision: connection.revision,
            },
            value,
          ),
      )

      if (updates.length) {
        for (const update of updates) {
          connection.state = candidateState(connection.state, update.update)
          connection.revision = update.revision
        }

        queueState(connection)
      }

      await expirePresence(connection)
      await pollPresence(connection)
      await pump(connection)
    } catch (error) {
      fail(connection, error)
    } finally {
      connection.polling = false
      schedulePoll(connection)
    }
  }

  function schedulePoll(connection: Connection) {
    if (connection.closed || connection.pollTimer) return
    connection.pollTimer = setTimeout(() => {
      connection.pollTimer = undefined
      void poll(connection)
    }, options.pollIntervalMs)
  }

  async function open(
    grant: EditorCollaborationGrant,
    socket: EditorCollaborationSocket,
  ) {
    if (
      connections.has(socket) ||
      !Number.isSafeInteger(grant.expiresAt) ||
      grant.expiresAt <= Date.now() ||
      !Number.isSafeInteger(grant.credentialExpiresAt) ||
      grant.credentialExpiresAt <= Date.now()
    ) {
      socket.close(1008, "collaboration authorization expired")
      throw new CollaborationError("denied")
    }

    let leaseId: string | undefined

    try {
      const execution = context(grant, options.timeoutMs)
      let head: Awaited<ReturnType<typeof options.log.load>>

      try {
        const allowed = await options.revalidate({
          documentId: grant.documentId,
          generation: grant.generation,
          identity: grant.identity,
          permission: grant.permission,
          credentialExpiresAt: grant.credentialExpiresAt,
          signal: execution.value.signal,
        })

        if (
          allowed !== true ||
          grant.expiresAt <= Date.now() ||
          grant.credentialExpiresAt <= Date.now()
        )
          throw new CollaborationError("denied")
        head = await options.log.load(grant.documentId, execution.value)

        if (grant.credentialExpiresAt <= Date.now())
          throw new CollaborationError("denied")
      } finally {
        execution.close()
      }

      if (head.generation !== grant.generation)
        throw new CollaborationError("conflict")

      const usedClientIds = Y.decodeStateVector(
        Y.encodeStateVectorFromUpdate(head.state),
      )

      const lease = await options.tickets.reserveClient({
        documentId: grant.documentId,
        generation: grant.generation,
        usedClientIds: new Set(usedClientIds.keys()),
        expiresAt: Math.min(grant.credentialExpiresAt, Date.now() + leaseMs),
      })

      leaseId = lease.leaseId

      const connection: Connection = {
        grant,
        socket,
        clientId: lease.clientId,
        leaseId: lease.leaseId,
        state: head.state.slice(),
        revision: head.revision,
        presenceRevision: "0",
        presenceClock: 0,
        presencePayload: null,
        presenceActive: false,
        windowStartedAt: Date.now(),
        frames: 0,
        sentBytes: 0,
        pending: null,
        vectorRequested: false,
        queue: [],
        queuedBytes: 0,
        pollTimer: undefined,
        polling: false,
        pumping: false,
        messageTail: Promise.resolve(),
        queuedMessages: 0,
        queuedMessageBytes: 0,
        closed: false,
      }

      connections.set(socket, connection)
      active.add(connection)
      await expirePresence(connection)
      socket.send(
        JSON.stringify({
          type: "ready",
          clientId: lease.clientId,
          generation: grant.generation,
          protocol: "editor-v1",
        }),
      )

      const present = await initialPresence(
        connection,
        await presenceHead(connection),
      )

      for (const entry of present)
        queued(connection, { kind: "awareness", payload: entry.payload })

      schedulePoll(connection)
    } catch (error) {
      if (connections.has(socket)) await close(socket)
      else if (leaseId)
        await options.tickets.releaseClient(leaseId).catch(() => undefined)
      socket.close(
        error instanceof CollaborationError && error.code === "denied"
          ? 1008
          : 1011,
        "collaboration session unavailable",
      )
      throw error
    }
  }

  async function processMessage(connection: Connection, data: IncomingMessage) {
    if (connection.closed) return

    try {
      check(connection)

      if (Date.now() - connection.windowStartedAt >= 1000) {
        connection.windowStartedAt = Date.now()
        connection.frames = 0
        connection.sentBytes = 0
      }

      if (++connection.frames > 32) throw new CollaborationError("budget")
      await load(connection)

      if (data.kind === "ack") {
        const ack = ackSchema.parse(JSON.parse(data.value))

        if (
          !connection.pending ||
          ack.ack !== connection.pending.id ||
          connection.pending.at + pendingDeliveryMs <= Date.now()
        )
          throw new CollaborationError("invalid")
        connection.pending = null
        connection.socket.send(JSON.stringify({ acked: ack.ack }))
        await pump(connection)

        return
      }

      const bytes = data.value
      connection.sentBytes += bytes.byteLength

      if (connection.sentBytes > 1048576) throw new CollaborationError("budget")
      const frame = decodeFrame(bytes, connection.grant.permission === "write")

      if (frame.kind === "vector") {
        if (connection.vectorRequested) throw new CollaborationError("invalid")
        connection.vectorRequested = true
        queued(connection, { kind: "vector", stateVector: frame.payload })
        const vector = connection.queue.pop()

        if (vector?.kind !== "vector") throw new CollaborationError("corrupt")
        connection.queue.unshift(vector)
        await pump(connection)

        return
      }

      if (frame.kind === "awareness") {
        const presence = validateAwareness(frame.payload, {
          clientId: connection.clientId,
          clock: connection.presenceClock,
          user: {
            id: connection.grant.identity.userId,
            name: connection.grant.identity.userId.slice(0, 128),
          },
        })

        const isActive = !isRemoval(presence.payload)

        const revision = await savePresence(
          connection,
          presence.clock,
          presence.payload,
          isActive,
          Math.min(connection.grant.credentialExpiresAt, Date.now() + 30000),
        )

        connection.presenceClock = presence.clock
        connection.presencePayload = isActive ? presence.payload : null
        connection.presenceActive = isActive
        connection.presenceRevision = revision
        queueAwareness(connection, presence.payload)
        await pump(connection)

        return
      }

      preflightUpdate(frame.payload)
      const head = await load(connection)

      const vector = Y.decodeStateVector(
        Y.encodeStateVectorFromUpdate(head.state),
      )

      const decoded = Y.decodeUpdate(frame.payload)

      for (const struct of decoded.structs)
        if (
          struct.id.clock + struct.length >
            (vector.get(struct.id.client) ?? 0) &&
          struct.id.client !== connection.clientId
        )
          throw new CollaborationError("denied")

      const result = await withContext(
        connection.grant,
        options.timeoutMs,
        (value) =>
          options.log.append(
            {
              documentId: connection.grant.documentId,
              generation: connection.grant.generation,
              revision: head.revision,
              operationId: randomToken(),
              update: frame.payload,
            },
            value,
          ),
      )

      connection.state = candidateState(head.state, frame.payload)
      connection.revision = result.revision
      queueState(connection)
      await pump(connection)
    } catch (error) {
      fail(connection, error)
    }
  }

  function message(
    socket: EditorCollaborationSocket,
    data: string | ArrayBuffer | Uint8Array,
  ) {
    const connection = connections.get(socket)

    if (!connection || connection.closed) {
      socket.close(1008, "collaboration session is not open")

      return Promise.resolve()
    }

    const incoming = incomingMessageSchema.safeParse(data)

    if (!incoming.success) {
      fail(connection, new CollaborationError("budget"))

      return Promise.resolve()
    }

    const copy = incoming.data
    const size = copy.byteLength

    if (
      connection.queuedMessages >= 32 ||
      connection.queuedMessageBytes + size > 1048576
    ) {
      fail(connection, new CollaborationError("budget"))

      return Promise.resolve()
    }

    const previous = connection.messageTail
    let release: () => void = () => undefined

    connection.messageTail = new Promise<void>((resolve) => {
      release = resolve
    })
    connection.queuedMessages++
    connection.queuedMessageBytes += size

    return (async function runQueuedMessage() {
      try {
        await previous
        await processMessage(connection, copy)
      } finally {
        connection.queuedMessages--
        connection.queuedMessageBytes -= size
        release()
      }
    })()
  }

  async function clearPresence(connection: Connection) {
    if (connection.presenceActive) {
      const clock = Math.min(connection.presenceClock + 1, 4294967295)
      const payload = encodeAwareness(connection.clientId, clock, null)

      const revision = await savePresence(
        connection,
        clock,
        payload,
        false,
        Date.now() + tombstoneMs,
      )

      queueAwareness(connection, payload)
      connection.presenceRevision = revision
    }
  }

  async function close(socket: EditorCollaborationSocket) {
    const connection = connections.get(socket)

    if (!connection || connection.closed) return
    connection.closed = true
    clearTimeout(connection.pollTimer)
    connection.pollTimer = undefined
    active.delete(connection)

    await clearPresence(connection).catch(() => undefined)

    await options.tickets
      .releaseClient(connection.leaseId)
      .catch(() => undefined)
  }

  function fail(connection: Connection, cause: unknown) {
    if (connection.closed) return

    const code =
      cause instanceof CollaborationError && cause.code === "denied"
        ? 1008
        : 1011

    void close(connection.socket)
    connection.socket.close(code, "collaboration session closed")
  }

  return {
    open,
    message,
    close,
    async error(socket) {
      await close(socket)
    },
  }
}

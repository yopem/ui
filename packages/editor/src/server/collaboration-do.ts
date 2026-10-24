import type {
  DurableObjectState,
  Scheduler,
  SqlStorageValue,
  WebSocket,
  WebSocketPair as WorkerWebSocketPair,
} from "@cloudflare/workers-types"

import * as encoding from "lib0/encoding"
import * as Y from "yjs"
import { z } from "zod"

import type {
  EditorAuthentication,
  EditorAuthorizationInput,
  EditorIdentity,
} from "./auth"
import type {
  CanonicalDocument,
  CollaborationCanonical,
} from "./collaboration-d1"

import { authorizeEditorRequest } from "./auth"
import { preflightUpdate } from "./collaboration/preflight"
import {
  awarenessFrame,
  candidateState,
  CollaborationError,
  collaborationLimits,
  decodeFrame,
  syncFrame,
  validateAwareness,
} from "./collaboration/protocol"
import { idSchema } from "./document-validation"

declare const WebSocketPair: typeof WorkerWebSocketPair

declare const scheduler: Scheduler

const identity = z.strictObject({
  provider: z.enum(["openauth", "better-auth"]),
  userId: z.string().min(1).max(256),
})

const grant = z.strictObject({
  documentId: idSchema,
  generation: z.string().regex(/^[0-9a-f]{64}$/),
  identity,
  permission: z.enum(["read", "write"]),
  credentialExpiresAt: z.number().int().positive(),
})

const attachment = grant.extend({
  clientId: z.number().int().min(0).max(4294967295),
  clock: z.number().int().min(0).max(4294967295),
  presence: z
    .instanceof(Uint8Array)
    .refine((value) => value.byteLength <= collaborationLimits.awarenessBytes)
    .nullable(),
  window: z.number().int().nonnegative(),
  frames: z.number().int().min(0).max(32),
  sent: z.number().int().min(0).max(1048576),
  pending: z
    .string()
    .regex(/^[0-9a-f]{32}$/)
    .nullable(),
  pendingAt: z.number().int().nonnegative(),
})

type Grant = z.infer<typeof grant>

interface Head extends Record<string, SqlStorageValue> {
  document_id: string
  generation: string
  state: ArrayBuffer
  phase: string
  revision: number
  history_bytes: number
}

const headSchema = z.strictObject({
  singleton: z.literal(1),
  document_id: idSchema,
  generation: z.string().regex(/^[0-9a-f]{64}$/),
  state: z
    .instanceof(ArrayBuffer)
    .refine(
      (value) =>
        value.byteLength >= 2 &&
        value.byteLength <= collaborationLimits.stateBytes,
    ),
  phase: z.enum(["seeded", "active"]),
  revision: z.number().int().min(0).max(256),
  history_bytes: z.number().int().min(0).max(1048576),
})

interface Budget {
  signal: AbortSignal
  check(): void
  fence(): Promise<void>
  call<T>(callback: () => T | Promise<T>): Promise<T>
}

export interface CollaborationRevalidation {
  documentId: string
  generation: string
  identity: EditorIdentity
  permission: "read" | "write"
  credentialExpiresAt: number
  signal: AbortSignal
}

export interface EditorCollaborationRoomOptions {
  origin: string
  basePath: string
  timeoutMs: number
  revalidateMs: number
  canonical: CollaborationCanonical
  authenticate: EditorAuthentication
  policy(input: EditorAuthorizationInput): boolean | Promise<boolean>
  verifyCsrf(input: {
    request: Request
    identity: EditorIdentity
    token: string
    signal: AbortSignal
  }): Promise<boolean>
  revalidate(input: CollaborationRevalidation): Promise<boolean>
  initialize(input: {
    documentId: string
    state: string
    schemaVersion: number
    signal: AbortSignal
  }): Promise<Uint8Array>
}

function opaque(bytes = 32) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("")
}

function response(status: number, value: Record<string, string | number>) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

export class EditorCollaborationRoom {
  private tail: Promise<void> = Promise.resolve()
  private pending = 0

  constructor(
    private readonly ctx: DurableObjectState,
    private readonly options: EditorCollaborationRoomOptions,
  ) {
    const origin = new URL(options.origin)

    if (
      origin.origin !== options.origin ||
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      !/^\/[A-Za-z0-9/_-]+\/$/.test(options.basePath) ||
      !Number.isInteger(options.timeoutMs) ||
      options.timeoutMs < 1 ||
      options.timeoutMs > 30000 ||
      !Number.isInteger(options.revalidateMs) ||
      options.revalidateMs < 1000 ||
      options.revalidateMs > 30000
    )
      throw new Error("invalid collaboration configuration")
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS collaboration_head(singleton INTEGER PRIMARY KEY CHECK(singleton=1),document_id TEXT NOT NULL,generation TEXT NOT NULL,state BLOB NOT NULL,phase TEXT NOT NULL,revision INTEGER NOT NULL,history_bytes INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS collaboration_tickets(token TEXT PRIMARY KEY,grant_json TEXT NOT NULL,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS collaboration_clients(client_id INTEGER PRIMARY KEY); CREATE TABLE IF NOT EXISTS collaboration_outbox(client_id INTEGER PRIMARY KEY,payload BLOB NOT NULL CHECK(length(payload) BETWEEN 1 AND 65536)); CREATE TABLE IF NOT EXISTS collaboration_updates(revision INTEGER PRIMARY KEY,update_bytes BLOB NOT NULL)`,
    )
    this.ctx.setHibernatableWebSocketEventTimeout(options.timeoutMs + 1000)
  }

  private execute<T>(
    work: (budget: Budget) => Promise<T>,
    incoming?: AbortSignal,
  ): Promise<T> {
    if (this.pending >= 8)
      return Promise.reject(new CollaborationError("budget"))
    this.pending++
    const controller = new AbortController()

    const signal = incoming
      ? AbortSignal.any([controller.signal, incoming])
      : controller.signal

    const deadline = Date.now() + this.options.timeoutMs

    const budget: Budget = {
      signal,
      check() {
        if (Date.now() >= deadline) controller.abort()
        signal.throwIfAborted()
      },
      async fence() {
        await scheduler.wait(0)
        budget.check()
      },
      async call<T>(callback: () => T | Promise<T>) {
        await budget.fence()
        const result = await callback()
        await budget.fence()

        return result
      },
    }

    let timer: ReturnType<typeof setTimeout>

    const expired = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new CollaborationError("aborted"))
      }, this.options.timeoutMs)
    })

    const operation = this.tail.then(() => {
      budget.check()

      return work(budget)
    })

    this.tail = operation.then(
      () => undefined,
      () => undefined,
    )
    void operation
      .finally(() => {
        this.pending--
        clearTimeout(timer)
      })
      .catch(() => undefined)

    return Promise.race([operation, expired])
  }

  private head() {
    const row = this.ctx.storage.sql
      .exec<Head>("SELECT * FROM collaboration_head WHERE singleton=1")
      .toArray()[0]

    if (row === undefined) return undefined
    const parsed = headSchema.safeParse(row)

    if (!parsed.success) throw new CollaborationError("corrupt")

    try {
      preflightUpdate(new Uint8Array(parsed.data.state))
    } catch {
      throw new CollaborationError("corrupt")
    }

    return parsed.data
  }

  private restored(socket: WebSocket) {
    const raw: unknown = socket.deserializeAttachment()

    return attachment.parse(raw)
  }

  private pruneOutbox() {
    const clients = this.ctx
      .getWebSockets()
      .filter((socket) => socket.readyState === 1)
      .map((socket) => this.restored(socket).clientId)

    this.ctx.storage.sql.exec(
      `DELETE FROM collaboration_outbox${clients.length ? ` WHERE client_id NOT IN (${clients.map(() => "?").join(",")})` : ""}`,
      ...clients,
    )
  }

  private async canonical(documentId: string, budget: Budget) {
    budget.check()

    const document = await budget.call(() =>
      this.options.canonical.read(documentId),
    )

    budget.check()

    if (!document || document.deleted || !document.state_json)
      throw new CollaborationError("conflict")

    return document
  }

  private async ensure(
    documentId: string,
    mayInitialize: boolean,
    budget: Budget,
    beforeEffect: (document: NonNullable<CanonicalDocument>) => Promise<void>,
  ) {
    let mutationStarted = false

    try {
      let document = await this.canonical(documentId, budget)
      let head = this.head()

      if (
        head &&
        (head.document_id !== documentId ||
          head.generation !== document.generation)
      )
        throw new CollaborationError("conflict")

      if (document.mode === "snapshot") {
        if (head || !mayInitialize || document.phase !== null)
          throw new CollaborationError("conflict")

        const snapshot = document.state_json

        if (snapshot === null || snapshot.length === 0)
          throw new CollaborationError("corrupt")

        const seed = await budget.call(() =>
          this.options.initialize({
            documentId,
            state: snapshot,
            schemaVersion: document.schema_version,
            signal: budget.signal,
          }),
        )

        budget.check()
        const state = candidateState(new Uint8Array([0, 0]), seed)
        budget.check()
        await beforeEffect(document)
        mutationStarted = true
        await budget.call(() =>
          this.options.canonical.prepare(
            document,
            state,
            this.ctx.id.toString(),
          ),
        )
        budget.check()
        document = await this.canonical(documentId, budget)
      }

      if (
        document.mode !== "yjs" ||
        document.phase === null ||
        document.seed === null ||
        document.coordinator_id !== this.ctx.id.toString()
      )
        throw new CollaborationError("conflict")

      if (!head) {
        if (document.phase !== "prepared")
          throw new CollaborationError("corrupt")
        const seed = candidateState(new Uint8Array([0, 0]), document.seed)
        budget.check()
        await beforeEffect(document)
        mutationStarted = true
        this.ctx.storage.sql.exec(
          "INSERT INTO collaboration_head VALUES(1,?,?,?,'seeded',0,0)",
          documentId,
          document.generation,
          seed.slice().buffer,
        )
        await this.ctx.storage.sync()
        budget.check()
        head = this.head()
      }

      if (!head) throw new CollaborationError("corrupt")

      if (head.phase === "seeded") {
        if (head.revision !== 0 || head.history_bytes !== 0)
          throw new CollaborationError("corrupt")
        await beforeEffect(document)
        mutationStarted = true
        await budget.call(() => this.options.canonical.activate(document))
        budget.check()
        await beforeEffect(document)
        this.ctx.storage.sql.exec(
          "UPDATE collaboration_head SET phase='active' WHERE singleton=1",
        )
        await this.ctx.storage.sync()
        budget.check()
      } else if (head.phase !== "active" || document.phase !== "active")
        throw new CollaborationError("corrupt")

      return this.head() ?? head
    } catch (error) {
      if (mutationStarted) throw new CollaborationError("uncertain")
      throw error
    }
  }

  private async authorize(value: Grant, budget: Budget) {
    budget.check()

    if (value.credentialExpiresAt <= Date.now())
      throw new CollaborationError("denied")

    const allowed = await budget.call(() =>
      this.options.revalidate({
        ...value,
        signal: budget.signal,
      }),
    )

    budget.check()

    if (allowed !== true || value.credentialExpiresAt <= Date.now())
      throw new CollaborationError("denied")
    const canonical = await this.canonical(value.documentId, budget)
    const head = this.head()

    if (
      head?.phase !== "active" ||
      head.generation !== value.generation ||
      canonical.generation !== value.generation ||
      canonical.mode !== "yjs" ||
      canonical.phase !== "active" ||
      canonical.coordinator_id !== this.ctx.id.toString()
    )
      throw new CollaborationError("conflict")
    await budget.fence()

    if (value.credentialExpiresAt <= Date.now())
      throw new CollaborationError("denied")
  }

  private async reserveAlarm() {
    const expires = this.ctx.storage.sql
      .exec<{ expires: number }>(
        "SELECT MIN(expires) AS expires FROM collaboration_tickets",
      )
      .toArray()[0]?.expires

    const sockets = this.ctx
      .getWebSockets()
      .filter((socket) => socket.readyState === 1)

    const next = Math.min(
      expires ?? Infinity,
      sockets.length ? Date.now() + this.options.revalidateMs : Infinity,
      ...sockets.map((socket) => {
        const value = this.restored(socket)

        return Math.min(
          value.credentialExpiresAt,
          value.pending
            ? value.pendingAt + this.options.revalidateMs
            : Infinity,
        )
      }),
    )

    if (Number.isFinite(next)) {
      const current = await this.ctx.storage.getAlarm()

      if (current === null || current > next)
        await this.ctx.storage.setAlarm(Math.max(Date.now() + 1, next))
    } else await this.ctx.storage.deleteAlarm()
  }

  async fetch(request: Request): Promise<Response> {
    try {
      return await this.execute(async (budget) => {
        const url = new URL(request.url)

        if (
          url.origin !== this.options.origin ||
          request.headers.get("Origin") !== this.options.origin
        )
          return response(403, { error: "origin" })

        if (
          url.search ||
          url.hash ||
          url.username ||
          url.password ||
          !url.pathname.startsWith(this.options.basePath)
        )
          return response(400, { error: "invalid" })

        const parts = url.pathname
          .slice(this.options.basePath.length)
          .split("/")

        const documentId = idSchema.parse(parts[0])

        if (parts.length !== 2) return response(404, { error: "not-found" })
        this.pruneOutbox()
        this.ctx.storage.sql.exec(
          "DELETE FROM collaboration_tickets WHERE expires<=?",
          Date.now(),
        )

        if (parts[1] === "ticket" && request.method === "POST") {
          const controlled = new Request(request, { signal: budget.signal })

          if (controlled.body !== null) {
            const reader = controlled.body.getReader()

            const cancel = () => {
              void reader.cancel().catch(() => undefined)
            }

            budget.signal.addEventListener("abort", cancel, { once: true })

            try {
              let done = false

              for (let index = 0; index < 16; index++) {
                budget.check()
                const chunk = await reader.read()
                budget.check()

                if (chunk.done) {
                  done = true
                  break
                }

                if (chunk.value.byteLength !== 0) break
              }

              if (!done) return response(400, { error: "body" })
            } finally {
              budget.signal.removeEventListener("abort", cancel)
              await reader.cancel().catch(() => undefined)
              reader.releaseLock()
            }
          }

          const permission = z
            .enum(["read", "write"])
            .parse(request.headers.get("X-Editor-Permission"))

          const authorization = await authorizeEditorRequest({
            request: controlled,
            documentId,
            action: permission === "write" ? "collab:write" : "collab:read",
            authenticate: (input) =>
              budget.call(() => this.options.authenticate(input)),
            policy: (input) => budget.call(() => this.options.policy(input)),
          })

          budget.check()

          if (authorization.status !== "authorized")
            return response(authorization.statusCode, {
              error: "authorization",
            })
          const authenticatedIdentity = identity.parse(authorization.identity)
          const credentialExpiresAt = authorization.credentialExpiresAt

          if (
            !Number.isSafeInteger(credentialExpiresAt) ||
            credentialExpiresAt === undefined ||
            credentialExpiresAt <= Date.now()
          )
            return response(401, { error: "expiry" })
          const token = request.headers.get("X-CSRF-Token")

          if (!token || !/^[\x21-\x7e]{1,256}$/.test(token))
            return response(403, { error: "csrf" })

          const csrf = await budget.call(() =>
            this.options.verifyCsrf({
              request: controlled,
              identity: authenticatedIdentity,
              token,
              signal: budget.signal,
            }),
          )

          budget.check()

          if (csrf !== true) return response(403, { error: "csrf" })

          if (credentialExpiresAt <= Date.now())
            return response(401, { error: "expiry" })

          const count = this.ctx.storage.sql
            .exec<{ count: number }>(
              "SELECT COUNT(*) AS count FROM collaboration_tickets",
            )
            .one().count

          if (count >= 64) throw new CollaborationError("budget")

          const head = await this.ensure(
            documentId,
            permission === "write",
            budget,
            async (document) => {
              await budget.fence()

              if (credentialExpiresAt <= Date.now())
                throw new CollaborationError("denied")

              const [allowed, valid] = await Promise.all([
                budget.call(() =>
                  this.options.policy({
                    request: controlled,
                    identity: authenticatedIdentity,
                    documentId,
                    action:
                      permission === "write" ? "collab:write" : "collab:read",
                  }),
                ),
                budget.call(() =>
                  this.options.revalidate({
                    documentId,
                    generation: document.generation,
                    identity: authenticatedIdentity,
                    permission,
                    credentialExpiresAt,
                    signal: budget.signal,
                  }),
                ),
              ])

              await budget.fence()

              if (
                allowed !== true ||
                valid !== true ||
                credentialExpiresAt <= Date.now()
              )
                throw new CollaborationError("denied")
            },
          )

          const value = grant.parse({
            documentId,
            generation: head.generation,
            identity: authenticatedIdentity,
            permission,
            credentialExpiresAt,
          })

          await this.authorize(value, budget)
          const opaqueTicket = opaque()
          const expiresAt = Math.min(Date.now() + 10000, credentialExpiresAt)
          budget.check()
          this.ctx.storage.sql.exec(
            "INSERT INTO collaboration_tickets VALUES(?,?,?)",
            opaqueTicket,
            JSON.stringify(value),
            expiresAt,
          )
          await this.reserveAlarm()
          await this.ctx.storage.sync()
          budget.check()

          if (credentialExpiresAt <= Date.now())
            return response(401, { error: "expiry" })

          return response(200, {
            ticket: opaqueTicket,
            expiresAt,
            protocol: "editor-v1",
          })
        }

        if (
          parts[1] !== "socket" ||
          request.method !== "GET" ||
          request.headers.get("Upgrade")?.toLowerCase() !== "websocket"
        )
          return response(400, { error: "upgrade" })
        const protocols = request.headers.get("Sec-WebSocket-Protocol")
        const match = /^editor-v1, ?([0-9a-f]{64})$/.exec(protocols ?? "")

        if (!match?.[1]) return response(401, { error: "ticket" })

        const stored = this.ctx.storage.transactionSync(
          () =>
            this.ctx.storage.sql
              .exec<{ grant_json: string; expires: number }>(
                "DELETE FROM collaboration_tickets WHERE token=? RETURNING grant_json,expires",
                match[1],
              )
              .toArray()[0],
        )

        await this.ctx.storage.sync()
        budget.check()

        if (!stored || stored.expires <= Date.now())
          return response(401, { error: "ticket" })
        const parsed: unknown = JSON.parse(stored.grant_json)
        const value = grant.parse(parsed)

        if (value.documentId !== documentId)
          return response(401, { error: "ticket" })
        await this.ensure(documentId, false, budget, async () => {
          await this.authorize(value, budget)
        })
        await this.authorize(value, budget)

        if (
          this.ctx.getWebSockets().filter((socket) => socket.readyState === 1)
            .length >= collaborationLimits.clients
        )
          throw new CollaborationError("budget")
        const head = this.head()

        if (!head) throw new CollaborationError("corrupt")

        const vector = Y.decodeStateVector(
          Y.encodeStateVectorFromUpdate(new Uint8Array(head.state)),
        )

        const previous =
          this.ctx.storage.sql
            .exec<{ client_id: number }>(
              "SELECT MAX(client_id) AS client_id FROM collaboration_clients",
            )
            .one().client_id ?? 0

        let clientId = previous + 1

        while (vector.has(clientId)) clientId++

        if (!Number.isSafeInteger(clientId) || clientId > 4294967295)
          throw new CollaborationError("budget")

        budget.check()
        this.ctx.storage.transactionSync(() => {
          this.ctx.storage.sql.exec("DELETE FROM collaboration_clients")
          this.ctx.storage.sql.exec(
            "INSERT INTO collaboration_clients VALUES(?)",
            clientId,
          )
        })
        await this.reserveAlarmForJoin(value.credentialExpiresAt)
        await this.ctx.storage.sync()
        budget.check()

        if (value.credentialExpiresAt <= Date.now())
          throw new CollaborationError("denied")
        const pair = new WebSocketPair()
        const server = pair[1]
        server.binaryType = "arraybuffer"
        server.serializeAttachment(
          attachment.parse({
            ...value,
            clientId,
            clock: 0,
            presence: null,
            window: Date.now(),
            frames: 0,
            sent: 0,
            pending: null,
            pendingAt: 0,
          }),
        )
        this.ctx.acceptWebSocket(server)
        server.send(
          JSON.stringify({
            type: "ready",
            clientId,
            generation: value.generation,
            protocol: "editor-v1",
          }),
        )

        const responseInit = {
          status: 101,
          webSocket: pair[0],
          headers: {
            "Sec-WebSocket-Protocol": "editor-v1",
            "Cache-Control": "no-store",
          },
        }

        return new Response(null, responseInit)
      }, request.signal)
    } catch (error) {
      if (error instanceof z.ZodError)
        return response(400, { error: "invalid" })

      if (error instanceof CollaborationError && error.code === "denied")
        return response(403, { error: "denied" })

      return response(503, {
        error: "uncertain",
        retry: "fresh-ticket-and-sync",
      })
    }
  }

  private async reserveAlarmForJoin(expiry: number) {
    const next = Math.min(expiry, Date.now() + this.options.revalidateMs)
    const current = await this.ctx.storage.getAlarm()

    if (current === null || current > next)
      await this.ctx.storage.setAlarm(next)
  }

  private async deliver(socket: WebSocket, bytes: Uint8Array, budget: Budget) {
    try {
      const value = this.restored(socket)
      await this.authorize(value, budget)

      if (bytes.length > collaborationLimits.frameBytes)
        throw new CollaborationError("budget")

      if (value.pending !== null) {
        if (value.pendingAt + this.options.revalidateMs <= Date.now())
          throw new CollaborationError("budget")

        const inserted = this.ctx.storage.sql
          .exec(
            "INSERT INTO collaboration_outbox VALUES(?,?) ON CONFLICT(client_id) DO NOTHING RETURNING client_id",
            value.clientId,
            bytes.slice().buffer,
          )
          .toArray()

        if (inserted.length !== 1) throw new CollaborationError("budget")
        await this.ctx.storage.sync()
        budget.check()

        return
      }

      if (Date.now() - value.window >= 1000) {
        value.window = Date.now()
        value.frames = 0
        value.sent = 0
      }

      value.sent += bytes.length

      if (value.sent > 1048576) throw new CollaborationError("budget")
      value.pending = opaque(16)
      value.pendingAt = Date.now()
      budget.check()
      socket.serializeAttachment(value)
      socket.send(bytes)
      socket.send(JSON.stringify({ delivery: value.pending }))
    } catch (error) {
      socket.close(
        error instanceof CollaborationError && error.code === "denied"
          ? 1008
          : 1011,
        "collaboration delivery closed",
      )
    }
  }

  private async broadcast(bytes: Uint8Array, budget: Budget) {
    await Promise.all(
      this.ctx
        .getWebSockets()
        .filter((socket) => socket.readyState === 1)
        .map((socket) => this.deliver(socket, bytes, budget)),
    )
  }

  async webSocketMessage(socket: WebSocket, message: ArrayBuffer | string) {
    if (
      message instanceof ArrayBuffer
        ? message.byteLength > collaborationLimits.frameBytes
        : message.length > 64
    ) {
      socket.close(1008, "collaboration frame budget")

      return
    }

    try {
      await this.execute(async (budget) => {
        const value = this.restored(socket)
        await this.authorize(value, budget)

        if (Date.now() - value.window >= 1000) {
          value.window = Date.now()
          value.frames = 0
          value.sent = 0
        }

        if (++value.frames > 32) throw new CollaborationError("budget")

        if (!(message instanceof ArrayBuffer)) {
          if (message.length > 64) throw new CollaborationError("invalid")
          let parsed: unknown

          try {
            parsed = JSON.parse(message)
          } catch {
            throw new CollaborationError("invalid")
          }

          const control = z
            .strictObject({ ack: z.string().regex(/^[0-9a-f]{32}$/) })
            .safeParse(parsed)

          if (!control.success) throw new CollaborationError("invalid")
          const ack = control.data

          if (
            value.pending === null ||
            ack.ack !== value.pending ||
            value.pendingAt + this.options.revalidateMs <= Date.now()
          )
            throw new CollaborationError("invalid")

          const queued = this.ctx.storage.sql
            .exec<{ payload: ArrayBuffer }>(
              "DELETE FROM collaboration_outbox WHERE client_id=? RETURNING payload",
              value.clientId,
            )
            .toArray()[0]

          value.pending = null
          value.pendingAt = 0
          socket.serializeAttachment(value)
          await this.ctx.storage.sync()
          budget.check()

          if (value.credentialExpiresAt <= Date.now())
            throw new CollaborationError("denied")
          socket.send(JSON.stringify({ acked: ack.ack }))

          if (queued) {
            const payload = z
              .instanceof(ArrayBuffer)
              .refine(
                (bytes) =>
                  bytes.byteLength > 0 &&
                  bytes.byteLength <= collaborationLimits.frameBytes,
              )
              .parse(queued.payload)

            await this.deliver(socket, new Uint8Array(payload), budget)
          }

          await this.reserveAlarm()
          budget.check()

          return
        }

        const frame = decodeFrame(
          new Uint8Array(message),
          value.permission === "write",
        )

        socket.serializeAttachment(value)
        const head = this.head()

        if (!head) throw new CollaborationError("corrupt")

        if (frame.kind === "vector") {
          await this.deliver(
            socket,
            syncFrame(new Uint8Array(head.state), frame.payload),
            budget,
          )
        } else if (frame.kind === "awareness") {
          const presence = validateAwareness(frame.payload, {
            clientId: value.clientId,
            clock: value.clock,
            user: {
              id: value.identity.userId,
              name: value.identity.userId.slice(0, 128),
            },
          })

          value.clock = presence.clock
          value.presence = presence.payload
          socket.serializeAttachment(value)
          await this.broadcast(awarenessFrame(presence.payload), budget)
        } else {
          preflightUpdate(frame.payload)
          const prior = new Uint8Array(head.state)

          const vector = Y.decodeStateVector(
            Y.encodeStateVectorFromUpdate(prior),
          )

          let decoded: ReturnType<typeof Y.decodeUpdate>

          try {
            decoded = Y.decodeUpdate(frame.payload)
          } catch {
            throw new CollaborationError("invalid")
          }

          for (const struct of decoded.structs)
            if (
              struct.id.clock + struct.length >
                (vector.get(struct.id.client) ?? 0) &&
              struct.id.client !== value.clientId
            )
              throw new CollaborationError("denied")
          const state = candidateState(prior, frame.payload)

          if (
            head.revision >= 256 ||
            head.history_bytes + frame.payload.length > 1048576
          )
            throw new CollaborationError("budget")
          await this.authorize(value, budget)
          budget.check()
          this.ctx.storage.transactionSync(() => {
            this.ctx.storage.sql.exec(
              "INSERT INTO collaboration_updates VALUES(?,?)",
              head.revision + 1,
              frame.payload.slice().buffer,
            )
            this.ctx.storage.sql.exec(
              "UPDATE collaboration_head SET state=?,revision=revision+1,history_bytes=history_bytes+? WHERE singleton=1",
              state.slice().buffer,
              frame.payload.length,
            )
          })
          await this.ctx.storage.sync()
          budget.check()
          await this.broadcast(syncFrame(state, new Uint8Array([0])), budget)
        }

        budget.check()
      })
    } catch (error) {
      socket.close(
        error instanceof CollaborationError || error instanceof z.ZodError
          ? 1008
          : 1011,
        "collaboration message closed",
      )
    }
  }

  async webSocketClose(socket: WebSocket) {
    socket.close(1000, "collaboration closed")

    try {
      await this.execute(async (budget) => {
        const value = this.restored(socket)
        this.ctx.storage.sql.exec(
          "DELETE FROM collaboration_outbox WHERE client_id=?",
          value.clientId,
        )

        if (value.presence !== null) {
          const encoder = encoding.createEncoder()
          encoding.writeVarUint(encoder, 1)
          encoding.writeVarUint(encoder, value.clientId)
          encoding.writeVarUint(encoder, Math.min(value.clock + 1, 4294967295))
          encoding.writeVarString(encoder, "null")
          await this.broadcast(
            awarenessFrame(encoding.toUint8Array(encoder)),
            budget,
          )
        }

        await this.reserveAlarm()
      })
    } catch {
      for (const peer of this.ctx.getWebSockets())
        peer.close(1011, "collaboration cleanup closed")
    }
  }

  async alarm() {
    try {
      await this.execute(async (budget) => {
        this.ctx.storage.sql.exec(
          "DELETE FROM collaboration_tickets WHERE expires<=?",
          Date.now(),
        )

        this.pruneOutbox()
        await Promise.all(
          this.ctx
            .getWebSockets()
            .filter((socket) => socket.readyState === 1)
            .map(async (socket) => {
              try {
                const value = this.restored(socket)
                await this.authorize(value, budget)

                if (
                  value.pending !== null &&
                  value.pendingAt + this.options.revalidateMs <= Date.now()
                )
                  throw new CollaborationError("budget")
              } catch {
                socket.close(1008, "collaboration authorization closed")
              }
            }),
        )

        await this.reserveAlarm()
      })
    } catch {
      for (const socket of this.ctx.getWebSockets())
        socket.close(1011, "collaboration alarm closed")
      throw new CollaborationError("unavailable")
    }
  }
}

import { z } from "zod"

import type { EditorIdentity } from "./auth"
import type {
  CollaborationQuery,
  CollaborationTransactions,
} from "./collaboration-postgres"

import {
  CollaborationError,
  collaborationLimits,
} from "./collaboration/protocol"
import { randomToken } from "./document-model"

const documentId = z
  .string()
  .min(3)
  .max(256)
  .regex(/^[A-Za-z0-9][A-Za-z0-9/_:.-]*$/)

const generation = z.string().regex(/^[a-f0-9]{64}$/)

const identity = z.strictObject({
  provider: z.enum(["openauth", "better-auth"]),
  userId: z.string().trim().min(1).max(256),
})

export interface EditorCollaborationGrant {
  documentId: string
  generation: string
  identity: EditorIdentity
  permission: "read" | "write"
  credentialExpiresAt: number
  expiresAt: number
}

export interface EditorCollaborationClientLease {
  clientId: number
  leaseId: string
}

export interface EditorCollaborationTicketStore {
  issue(input: EditorCollaborationGrant): Promise<string>
  consume(token: string): Promise<EditorCollaborationGrant | null>
  reserveClient(input: {
    documentId: string
    generation: string
    usedClientIds: ReadonlySet<number>
    expiresAt: number
  }): Promise<EditorCollaborationClientLease>
  renewClient(leaseId: string, expiresAt: number): Promise<boolean>
  releaseClient(leaseId: string): Promise<void>
}

export interface EditorCollaborationTicketStoreOptions {
  transactions: CollaborationTransactions
  timeoutMs: number
  maxTickets?: number
  maxClients?: number
}

const grantRow = z.strictObject({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  document_id: documentId,
  generation,
  provider: z.enum(["openauth", "better-auth"]),
  user_id: z.string().trim().min(1).max(256),
  permission: z.enum(["read", "write"]),
  credential_expires_at: z.union([z.string(), z.number()]),
  expires_at: z.union([z.string(), z.number()]),
})

function timestamp(value: string | number) {
  const result = Number(value)

  if (!Number.isSafeInteger(result) || result < 1)
    throw new CollaborationError("corrupt")

  return result
}

function grantFromRow(
  value: z.infer<typeof grantRow>,
): EditorCollaborationGrant {
  const grant = {
    documentId: value.document_id,
    generation: value.generation,
    identity: { provider: value.provider, userId: value.user_id },
    permission: value.permission,
    credentialExpiresAt: timestamp(value.credential_expires_at),
    expiresAt: timestamp(value.expires_at),
  }

  if (grant.expiresAt > grant.credentialExpiresAt)
    throw new CollaborationError("corrupt")

  return grant
}

function createDeadline(timeoutMs: number, expiry = Number.MAX_SAFE_INTEGER) {
  const now = Date.now()

  if (!Number.isSafeInteger(expiry) || expiry <= now)
    throw new CollaborationError("denied")

  const controller = new AbortController()
  const deadline = Math.min(now + timeoutMs, expiry)

  const timer = setTimeout(
    () => controller.abort(),
    Math.max(0, deadline - Date.now()),
  )

  return {
    signal: controller.signal,
    deadline,
    close() {
      clearTimeout(timer)
    },
  }
}

function parseClientIds(rows: unknown[]) {
  return rows.map((row) =>
    z
      .strictObject({ client_id: z.union([z.string(), z.number()]) })
      .transform((value) => Number(value.client_id))
      .pipe(z.number().int().min(0).max(4294967295))
      .parse(row),
  )
}

export function createPostgresCollaborationTicketStore(
  options: EditorCollaborationTicketStoreOptions,
): EditorCollaborationTicketStore {
  const maxTickets = options.maxTickets ?? 4096
  const maxClients = options.maxClients ?? collaborationLimits.clients

  if (
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 30000 ||
    !Number.isSafeInteger(maxTickets) ||
    maxTickets < 1 ||
    maxTickets > 65536 ||
    !Number.isSafeInteger(maxClients) ||
    maxClients < 1 ||
    maxClients > collaborationLimits.clients
  )
    throw new CollaborationError("invalid")

  async function transaction<T>(
    work: (query: CollaborationQuery) => Promise<T>,
    expiry?: number,
  ) {
    const deadline = createDeadline(options.timeoutMs, expiry)

    try {
      try {
        return await options.transactions.run(
          deadline.signal,
          deadline.deadline,
          work,
        )
      } finally {
        deadline.close()
      }
    } catch (error) {
      if (error instanceof CollaborationError) throw error
      throw new CollaborationError(
        deadline.signal.aborted ? "aborted" : "unavailable",
      )
    }
  }

  return {
    async issue(input) {
      const parsedIdentity = identity.safeParse(input.identity)

      if (
        !documentId.safeParse(input.documentId).success ||
        !generation.safeParse(input.generation).success ||
        !parsedIdentity.success ||
        !Number.isSafeInteger(input.credentialExpiresAt) ||
        !Number.isSafeInteger(input.expiresAt) ||
        input.expiresAt <= Date.now() ||
        input.credentialExpiresAt <= Date.now() ||
        input.expiresAt > input.credentialExpiresAt ||
        input.expiresAt - Date.now() > 30000 ||
        (input.permission !== "read" && input.permission !== "write")
      )
        throw new CollaborationError("invalid")

      const ticket = randomToken()

      return await transaction(async function insertTicket(query) {
        await query(
          "LOCK TABLE editor_collaboration_tickets IN SHARE ROW EXCLUSIVE MODE",
          [],
        )
        await query(
          "DELETE FROM editor_collaboration_tickets WHERE expires_at <= $1",
          [String(Date.now())],
        )

        const counts = await query(
          "SELECT count(*)::text AS count FROM editor_collaboration_tickets",
          [],
        )

        const count = z
          .strictObject({ count: z.string().regex(/^[0-9]+$/) })
          .parse(counts[0])

        if (BigInt(count.count) >= BigInt(maxTickets))
          throw new CollaborationError("budget")

        const inserted = await query(
          "INSERT INTO editor_collaboration_tickets(token,document_id,generation,provider,user_id,permission,credential_expires_at,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(token) DO NOTHING RETURNING token",
          [
            ticket,
            input.documentId,
            input.generation,
            parsedIdentity.data.provider,
            parsedIdentity.data.userId,
            input.permission,
            String(input.credentialExpiresAt),
            String(input.expiresAt),
          ],
        )

        if (inserted.length !== 1) throw new CollaborationError("budget")

        return ticket
      }, input.credentialExpiresAt)
    },
    async consume(token) {
      if (!/^[a-f0-9]{64}$/.test(token)) throw new CollaborationError("invalid")

      const rows = await transaction(function consumeTicket(query) {
        return query(
          "DELETE FROM editor_collaboration_tickets WHERE token=$1 RETURNING token,document_id,generation,provider,user_id,permission,credential_expires_at,expires_at",
          [token],
        )
      })

      if (rows.length === 0) return null

      if (rows.length !== 1) throw new CollaborationError("corrupt")
      const grant = grantFromRow(grantRow.parse(rows[0]))

      if (
        grant.expiresAt <= Date.now() ||
        grant.credentialExpiresAt <= Date.now()
      )
        return null

      return grant
    },
    async reserveClient(input) {
      if (
        !documentId.safeParse(input.documentId).success ||
        !generation.safeParse(input.generation).success ||
        !Number.isSafeInteger(input.expiresAt) ||
        input.expiresAt <= Date.now() ||
        [...input.usedClientIds].some(
          (clientId) =>
            !Number.isSafeInteger(clientId) ||
            clientId < 0 ||
            clientId > 4294967295,
        )
      )
        throw new CollaborationError("invalid")
      const leaseId = randomToken().slice(0, 32)

      return await transaction(async function insertLease(query) {
        await query(
          "LOCK TABLE editor_collaboration_clients IN SHARE ROW EXCLUSIVE MODE",
          [],
        )
        await query(
          "DELETE FROM editor_collaboration_clients WHERE expires_at <= $1",
          [String(Date.now())],
        )

        const rows = await query(
          "SELECT client_id::text FROM editor_collaboration_clients WHERE document_id=$1 AND generation=$2 AND expires_at>$3",
          [input.documentId, input.generation, String(Date.now())],
        )

        const active = parseClientIds(rows)

        if (active.length >= maxClients) throw new CollaborationError("budget")
        await query(
          "LOCK TABLE editor_collaboration_presence IN SHARE ROW EXCLUSIVE MODE",
          [],
        )
        await query(
          "DELETE FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2 AND active=FALSE AND expires_at<=$3",
          [input.documentId, input.generation, String(Date.now())],
        )

        const recentPresence = await query(
          "SELECT client_id::text FROM editor_collaboration_presence WHERE document_id=$1 AND generation=$2",
          [input.documentId, input.generation],
        )

        const recent = parseClientIds(recentPresence)
        const used = new Set([...input.usedClientIds, ...active, ...recent])

        for (let attempt = 0; attempt < 16; attempt++) {
          const bytes = crypto.getRandomValues(new Uint32Array(1))
          const clientId = bytes[0]

          if (clientId === undefined || used.has(clientId)) continue

          const inserted = await query(
            "INSERT INTO editor_collaboration_clients(document_id,generation,client_id,lease_id,expires_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING client_id::text,lease_id",
            [
              input.documentId,
              input.generation,
              String(clientId),
              leaseId,
              String(input.expiresAt),
            ],
          )

          if (inserted.length === 1) {
            const value = z
              .strictObject({
                client_id: z.string().regex(/^[0-9]+$/),
                lease_id: z.string().regex(/^[a-f0-9]{32}$/),
              })
              .parse(inserted[0])

            return {
              clientId: Number(value.client_id),
              leaseId: value.lease_id,
            }
          }
        }

        throw new CollaborationError("budget")
      }, input.expiresAt)
    },
    async renewClient(leaseId, expiresAt) {
      if (
        !/^[a-f0-9]{32}$/.test(leaseId) ||
        !Number.isSafeInteger(expiresAt) ||
        expiresAt <= Date.now()
      )
        throw new CollaborationError("invalid")

      const rows = await transaction(function renewLease(query) {
        return query(
          "UPDATE editor_collaboration_clients SET expires_at=$2 WHERE lease_id=$1 AND expires_at>$3 RETURNING lease_id",
          [leaseId, String(expiresAt), String(Date.now())],
        )
      }, expiresAt)

      return rows.length === 1
    },
    async releaseClient(leaseId) {
      if (!/^[a-f0-9]{32}$/.test(leaseId))
        throw new CollaborationError("invalid")
      await transaction(function releaseLease(query) {
        return query(
          "DELETE FROM editor_collaboration_clients WHERE lease_id=$1",
          [leaseId],
        )
      })
    },
  }
}

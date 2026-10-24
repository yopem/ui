import { z } from "zod"

import type {
  EditorAuthentication,
  EditorAuthorizationInput,
  EditorIdentity,
} from "./auth"
import type { CollaborationTransactions } from "./collaboration-postgres"
import type {
  EditorCollaborationRevalidation,
  EditorCollaborationSessionHandler,
  EditorCollaborationSocket as CollaborationSocket,
} from "./collaboration-session"
import type {
  EditorCollaborationGrant,
  EditorCollaborationTicketStore,
} from "./collaboration-tickets"

export type { EditorCollaborationSocket } from "./collaboration-session"

import type { createPostgresCollaborationLog } from "./collaboration-postgres"

import { authorizeEditorRequest } from "./auth"
import { CollaborationError } from "./collaboration/protocol"
import { idSchema } from "./document-validation"

export interface EditorCollaborationSocketCallbacks {
  open(socket: CollaborationSocket): Promise<void>
  message(
    socket: CollaborationSocket,
    data: string | ArrayBuffer | Uint8Array,
  ): Promise<void>
  close(socket: CollaborationSocket): Promise<void>
  error(socket: CollaborationSocket): Promise<void>
}

export type EditorCollaborationUpgrade = (
  this: void,
  request: Request,
  protocol: "editor-v1",
  callbacks: EditorCollaborationSocketCallbacks,
) => boolean | Response | Promise<boolean | Response>

export interface EditorCollaborationHttpOptions {
  origin: string
  basePath: string
  timeoutMs: number
  authenticate: EditorAuthentication
  policy(
    input: EditorAuthorizationInput,
  ): boolean | "unavailable" | Promise<boolean | "unavailable">
  verifyCsrf(input: {
    request: Request
    identity: EditorIdentity
    token: string
    signal: AbortSignal
  }): Promise<boolean>
  revalidate(input: EditorCollaborationRevalidation): Promise<boolean>
  transactions: CollaborationTransactions
  log: ReturnType<typeof createPostgresCollaborationLog>
  tickets: EditorCollaborationTicketStore
  sessions: EditorCollaborationSessionHandler
  initialize(input: {
    documentId: string
    state: string
    schemaVersion: number
    signal: AbortSignal
  }): Promise<Uint8Array>
  upgrade: EditorCollaborationUpgrade
}

const canonicalRow = z.strictObject({
  document_id: idSchema,
  generation: z.string().regex(/^[a-f0-9]{64}$/),
  revision: z.string().regex(/^[1-9][0-9]{0,18}$/),
  mode: z.enum(["snapshot", "yjs"]),
  schema_version: z.number().int().positive().max(2147483647),
  deleted: z.number().int().min(0).max(1),
})

const ticketBody = z.strictObject({
  ticket: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.number().int().positive(),
  protocol: z.literal("editor-v1"),
})

const protocolHeader = /^editor-v1, ?([a-f0-9]{64})$/

function response(status: number, error: string) {
  return Response.json(
    { error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  )
}

function ticketResponse(ticket: string, expiresAt: number) {
  const body = ticketBody.parse({
    ticket,
    expiresAt,
    protocol: "editor-v1",
  })

  return Response.json(body, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

function controlledRequest(request: Request, timeoutMs: number) {
  const controller = new AbortController()
  const deadline = Date.now() + timeoutMs

  const timer = setTimeout(
    () => controller.abort(),
    Math.max(0, deadline - Date.now()),
  )

  const abort = function abortFromRequest() {
    controller.abort()
  }

  request.signal.addEventListener("abort", abort, { once: true })

  if (request.signal.aborted) controller.abort()

  return {
    request: new Request(request, { signal: controller.signal }),
    signal: controller.signal,
    deadline,
    close() {
      clearTimeout(timer)
      request.signal.removeEventListener("abort", abort)
    },
  }
}

function route(pathname: string, basePath: string) {
  if (!pathname.startsWith(basePath)) return null
  const parts = pathname.slice(basePath.length).split("/")

  if (parts.length !== 2 || (parts[1] !== "ticket" && parts[1] !== "socket"))
    return null
  let documentId: string

  try {
    documentId = decodeURIComponent(parts[0] ?? "")
  } catch {
    return null
  }

  if (!idSchema.safeParse(documentId).success) return null

  return { documentId, endpoint: parts[1] }
}

function responseStatus(cause: unknown) {
  if (!(cause instanceof CollaborationError)) return 503

  switch (cause.code) {
    case "invalid":
      return 400
    case "denied":
      return 403
    case "conflict":
      return 409
    case "budget":
      return 429
    case "aborted":
    case "unavailable":
    case "uncertain":
    case "pending":
    case "subdocument":
    case "corrupt":
      return 503
  }
}

function sessionCallbacks(
  sessions: EditorCollaborationSessionHandler,
  grant: EditorCollaborationGrant,
): EditorCollaborationSocketCallbacks {
  return {
    async open(socket) {
      try {
        await sessions.open(grant, socket)
      } catch {
        socket.close(1011, "collaboration session unavailable")
      }
    },
    async message(socket, data) {
      await sessions.message(socket, data)
    },
    async close(socket) {
      await sessions.close(socket)
    },
    async error(socket) {
      await sessions.error(socket)
    },
  }
}

export function createEditorCollaborationHttpHandler(
  options: EditorCollaborationHttpOptions,
) {
  let origin: URL

  try {
    origin = new URL(options.origin)
  } catch {
    throw new CollaborationError("invalid")
  }

  if (
    origin.origin !== options.origin ||
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    !/^\/[A-Za-z0-9/_-]+\/$/.test(options.basePath) ||
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 30000
  )
    throw new CollaborationError("invalid")

  async function canonical(
    documentId: string,
    signal: AbortSignal,
    deadline: number,
  ) {
    const rows = await options.transactions.run(signal, deadline, (query) =>
      query(
        "SELECT document_id,generation,revision::text,mode,schema_version,deleted FROM editor_documents WHERE document_id=$1",
        [documentId],
      ),
    )

    if (rows.length !== 1) throw new CollaborationError("conflict")
    const value = canonicalRow.parse(rows[0])

    if (value.deleted !== 0) throw new CollaborationError("conflict")

    return value
  }

  async function issueTicket(request: Request, documentId: string) {
    const permission = request.headers.get("X-Editor-Permission")

    if (permission !== "read" && permission !== "write")
      return response(400, "invalid")

    if (
      request.body !== null ||
      (request.headers.has("Content-Length") &&
        request.headers.get("Content-Length") !== "0")
    )
      return response(400, "invalid")
    const execution = controlledRequest(request, options.timeoutMs)

    try {
      const authorization = await authorizeEditorRequest({
        request: execution.request,
        documentId,
        action: permission === "write" ? "collab:write" : "collab:read",
        authenticate: options.authenticate,
        policy(input) {
          return options.policy(input)
        },
      })

      if (authorization.status !== "authorized")
        return response(authorization.statusCode, "denied")
      const credentialExpiresAt = authorization.credentialExpiresAt

      if (
        credentialExpiresAt === undefined ||
        credentialExpiresAt <= Date.now()
      )
        return response(401, "denied")
      const csrf = execution.request.headers.get("X-CSRF-Token")

      if (!csrf || csrf.length > 2048) return response(403, "denied")

      const csrfValid = await options.verifyCsrf({
        request: execution.request,
        identity: authorization.identity,
        token: csrf,
        signal: execution.signal,
      })

      if (csrfValid !== true || credentialExpiresAt <= Date.now())
        return response(403, "denied")

      const row = await canonical(
        documentId,
        execution.signal,
        Math.min(execution.deadline, credentialExpiresAt),
      )

      if (row.mode === "snapshot") {
        if (permission !== "write") return response(409, "conflict")
        await options.log.initialize(
          {
            documentId,
            generation: row.generation,
            revision: row.revision,
            initialize: ({ state, schemaVersion, signal }) =>
              options.initialize({
                documentId,
                state,
                schemaVersion,
                signal,
              }),
          },
          {
            identity: authorization.identity,
            credentialExpiresAt,
            signal: execution.signal,
            deadline: Math.min(execution.deadline, credentialExpiresAt),
          },
        )
      }

      const head = await options.log.load(documentId, {
        identity: authorization.identity,
        credentialExpiresAt,
        signal: execution.signal,
        deadline: Math.min(execution.deadline, credentialExpiresAt),
      })

      if (head.generation !== row.generation)
        throw new CollaborationError("conflict")

      if (credentialExpiresAt <= Date.now())
        throw new CollaborationError("denied")
      const expiresAt = Math.min(Date.now() + 10000, credentialExpiresAt)

      const ticket = await options.tickets.issue({
        documentId,
        generation: head.generation,
        identity: authorization.identity,
        permission,
        credentialExpiresAt,
        expiresAt,
      })

      return ticketResponse(ticket, expiresAt)
    } catch (error) {
      return response(responseStatus(error), "unavailable")
    } finally {
      execution.close()
    }
  }

  async function upgradeSocket(request: Request, documentId: string) {
    const header = request.headers.get("Sec-WebSocket-Protocol") ?? ""
    const match = protocolHeader.exec(header)

    const connection = request.headers
      .get("Connection")
      ?.split(",")
      .map((part) => part.trim().toLowerCase())

    if (
      request.method !== "GET" ||
      request.body !== null ||
      request.headers.get("Upgrade")?.toLowerCase() !== "websocket" ||
      !connection?.includes("upgrade") ||
      !match?.[1]
    )
      return response(400, "invalid")

    const execution = controlledRequest(request, options.timeoutMs)

    try {
      const grant = await options.tickets.consume(match[1])

      if (
        !grant ||
        grant.documentId !== documentId ||
        grant.expiresAt <= Date.now() ||
        grant.credentialExpiresAt <= Date.now()
      )
        return response(401, "denied")

      const allowed = await options.revalidate({
        documentId: grant.documentId,
        generation: grant.generation,
        identity: grant.identity,
        permission: grant.permission,
        credentialExpiresAt: grant.credentialExpiresAt,
        signal: execution.signal,
      })

      if (
        allowed !== true ||
        grant.expiresAt <= Date.now() ||
        grant.credentialExpiresAt <= Date.now()
      )
        return response(403, "denied")

      const head = await options.log.load(documentId, {
        identity: grant.identity,
        credentialExpiresAt: grant.credentialExpiresAt,
        signal: execution.signal,
        deadline: Math.min(execution.deadline, grant.credentialExpiresAt),
      })

      if (head.generation !== grant.generation)
        throw new CollaborationError("conflict")

      if (
        grant.expiresAt <= Date.now() ||
        grant.credentialExpiresAt <= Date.now()
      )
        throw new CollaborationError("denied")

      const result = await options.upgrade(
        execution.request,
        "editor-v1",
        sessionCallbacks(options.sessions, grant),
      )

      if (result instanceof Response) return result

      if (result !== true) return response(400, "invalid")

      return undefined
    } catch (error) {
      return response(responseStatus(error), "unavailable")
    } finally {
      execution.close()
    }
  }

  return {
    async fetch(request: Request) {
      let url: URL

      try {
        url = new URL(request.url)
      } catch {
        return response(400, "invalid")
      }

      if (
        url.origin !== options.origin ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        request.headers.get("Origin") !== options.origin
      )
        return response(403, "denied")
      const target = route(url.pathname, options.basePath)

      if (!target) return response(404, "not-found")

      if (target.endpoint === "ticket") {
        if (request.method !== "POST") return response(405, "method")

        return await issueTicket(request, target.documentId)
      }

      return await upgradeSocket(request, target.documentId)
    },
  }
}

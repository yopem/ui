import { z } from "zod"

import type { EditorAuthentication, EditorAuthorizationInput } from "./auth"
import type {
  DocumentContext,
  DocumentMutation,
  DocumentRecord,
  DocumentResult,
} from "./document-model"

import { authorizeEditorRequest } from "./auth"
import { documentId, DocumentError, parseExpected } from "./document-model"
import { withinSignal } from "./document-service"
import { callableSchema } from "./document-validation"

export type DocumentHttpDecision = boolean | "unavailable"

export interface DocumentHttpOptions {
  origin: string
  basePath: string
  authenticate: EditorAuthentication
  policy(
    this: void,
    input: EditorAuthorizationInput,
  ): DocumentHttpDecision | Promise<DocumentHttpDecision>
  verifyCsrf(
    this: void,
    input: {
      request: Request
      identity: DocumentContext["identity"]
      token: string
      signal: AbortSignal
    },
  ): DocumentHttpDecision | Promise<DocumentHttpDecision>
  service: {
    read(
      documentId: string,
      context: DocumentContext,
    ): Promise<DocumentRecord | null>
    mutate(
      input: DocumentMutation,
      context: DocumentContext,
    ): Promise<DocumentResult>
  }
  timeoutMs: number
  maxConcurrent: number
}

const payloadSchema = z.strictObject({
  schemaVersion: z.number().int().min(1).max(2147483647),
  state: z.json(),
})

class HttpError extends Error {
  constructor(public readonly status: number) {
    super("request rejected")
  }
}

function response(
  status: number,
  value: DocumentRecord | { error: string; retry?: "same-operation" },
  etag?: string,
) {
  const headers = new Headers({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  })

  if (etag) headers.set("etag", etag)

  if (status === 405) headers.set("allow", "GET, PUT, DELETE")

  return Response.json(value, { status, headers })
}

async function readBody(
  request: Request,
  signal: AbortSignal,
  deadline: number,
) {
  const length = request.headers.get("content-length")

  if (
    length !== null &&
    (!/^(0|[1-9][0-9]*)$/.test(length) || Number(length) > 1048576)
  )
    throw new HttpError(413)

  if (!request.body) throw new HttpError(400)
  const reader = request.body.getReader()
  const bytes = new Uint8Array(1048576)
  let size = 0

  try {
    for (;;) {
      if (signal.aborted || Date.now() >= deadline)
        throw new DocumentError("aborted")
      const chunk = await withinSignal(reader.read(), signal)

      if (chunk.done) break

      if (size + chunk.value.byteLength > bytes.length) throw new HttpError(413)
      bytes.set(chunk.value, size)
      size += chunk.value.byteLength
    }
  } finally {
    void reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      bytes.subarray(0, size),
    )

    let depth = 0
    let quoted = false
    let escaped = false

    for (const character of text) {
      if (quoted) {
        if (escaped) escaped = false
        else if (character === "\\") escaped = true
        else if (character === '"') quoted = false
      } else if (character === '"') quoted = true
      else if (character === "{" || character === "[") {
        if (++depth > 66) throw new HttpError(413)
      } else if (character === "}" || character === "]") depth--
    }

    return payloadSchema.parse(JSON.parse(text))
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400)
  }
}

export function createDocumentHttpHandler(options: DocumentHttpOptions) {
  const origin = new URL(options.origin)

  if (
    origin.origin !== options.origin ||
    !["https:", "http:"].includes(origin.protocol) ||
    !/^\/(?:[A-Za-z0-9_-]+\/)+$/.test(options.basePath) ||
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 30000 ||
    !Number.isSafeInteger(options.maxConcurrent) ||
    options.maxConcurrent < 1 ||
    options.maxConcurrent > 64 ||
    !callableSchema.safeParse(options.authenticate).success ||
    !callableSchema.safeParse(options.policy).success ||
    !callableSchema.safeParse(options.verifyCsrf).success
  )
    throw new DocumentError("invalid")
  let active = 0
  let pending = 0

  async function track<T>(work: T | Promise<T>) {
    pending++

    try {
      return await work
    } finally {
      pending--
    }
  }

  return async function handleDocumentRequest(
    incomingRequest: Request,
  ): Promise<Response> {
    if (Math.max(active, pending) >= options.maxConcurrent)
      return response(503, { error: "unavailable" })
    active++
    const timer = new AbortController()
    let deadline = Date.now() + options.timeoutMs
    let timeout = setTimeout(() => timer.abort(), options.timeoutMs)
    const signal = AbortSignal.any([incomingRequest.signal, timer.signal])

    function checkDeadline() {
      if (Date.now() >= deadline) timer.abort()
      signal.throwIfAborted()
    }

    async function run(request: Request) {
      let mutationStarted = false

      try {
        signal.throwIfAborted()
        const url = new URL(request.url)

        if (
          url.origin !== options.origin ||
          url.search ||
          url.hash ||
          url.username ||
          url.password ||
          !url.pathname.startsWith(options.basePath)
        )
          throw new HttpError(400)
        const id = documentId(url.pathname.slice(options.basePath.length))

        if (!["GET", "PUT", "DELETE"].includes(request.method))
          throw new HttpError(405)
        const write = request.method !== "GET"

        if (write && request.headers.get("origin") !== options.origin)
          throw new HttpError(403)

        checkDeadline()

        const authorization = await withinSignal(
          authorizeEditorRequest({
            request,
            documentId: id,
            action:
              request.method === "GET"
                ? "document:read"
                : request.method === "DELETE"
                  ? "document:delete"
                  : "document:write",
            authenticate: async function authenticate(input) {
              checkDeadline()

              const result = await withinSignal(
                track(options.authenticate(input)),
                signal,
              )

              checkDeadline()

              return result
            },
            policy: async function policy(input) {
              checkDeadline()

              const result = await withinSignal(
                track(options.policy(input)),
                signal,
              )

              checkDeadline()

              return result
            },
          }),
          signal,
        )

        checkDeadline()

        if (authorization.status !== "authorized")
          throw new HttpError(authorization.statusCode)

        deadline = Math.min(
          deadline,
          authorization.credentialExpiresAt ?? deadline,
        )
        clearTimeout(timeout)
        timeout = setTimeout(
          () => timer.abort(),
          Math.max(0, deadline - Date.now()),
        )
        checkDeadline()

        const context = {
          identity: authorization.identity,
          signal,
          deadline,
        }

        if (!write) {
          const record = await withinSignal(
            track(options.service.read(id, context)),
            signal,
          )

          checkDeadline()

          if (!record || record.deleted)
            return response(404, { error: "not-found" })

          const result = response(200, record, record.etag)

          checkDeadline()

          return result
        }

        const token = request.headers.get("x-csrf-token")

        if (!token || token.length > 256 || !/^[\x21-\x7e]+$/.test(token))
          throw new HttpError(403)

        const csrf = await withinSignal(
          track(
            options.verifyCsrf({
              request,
              identity: authorization.identity,
              token,
              signal,
            }),
          ),
          signal,
        )

        checkDeadline()

        if (csrf !== true) throw new HttpError(csrf === false ? 403 : 503)
        const match = request.headers.get("if-match")
        const absent = request.headers.get("if-none-match")

        if (match === null && absent === null) throw new HttpError(428)

        if (
          (match !== null && absent !== null) ||
          (absent !== null && absent !== "*") ||
          (request.method === "DELETE" && absent !== null)
        )
          throw new HttpError(400)

        const expected =
          match === null
            ? ({ kind: "absent" } as const)
            : ({ kind: "etag", etag: match } as const)

        parseExpected(expected)
        const operationId = request.headers.get("idempotency-key")

        if (!operationId || !/^[A-Za-z0-9_-]{16,128}$/.test(operationId))
          throw new HttpError(400)
        let change: DocumentMutation["change"]

        if (request.method === "DELETE") {
          if (
            request.body !== null ||
            (request.headers.get("content-length") ?? "0") !== "0"
          )
            throw new HttpError(400)
          change = { kind: "delete" }
        } else {
          if (
            !/^application\/json(?:;\s*charset=utf-8)?$/i.test(
              request.headers.get("content-type") ?? "",
            ) ||
            request.headers.has("content-encoding")
          )
            throw new HttpError(415)
          const payload = await readBody(request, signal, context.deadline)
          change = {
            kind: "save",
            schemaVersion: payload.schemaVersion,
            state: JSON.stringify(payload.state),
          }
        }

        if (
          authorization.credentialExpiresAt !== undefined &&
          authorization.credentialExpiresAt <= Date.now()
        )
          throw new HttpError(401)

        checkDeadline()
        mutationStarted = true

        const result = await withinSignal(
          track(
            options.service.mutate(
              { documentId: id, operationId, expected, change },
              context,
            ),
          ),
          signal,
        )

        checkDeadline()

        if (result.status === "conflict")
          return response(412, { error: "precondition-failed" })

        const committed = response(200, result.record, result.record.etag)

        checkDeadline()

        return committed
      } catch (error) {
        if (Date.now() >= deadline) timer.abort()

        if (
          mutationStarted &&
          (signal.aborted || !(error instanceof DocumentError))
        )
          return response(503, { error: "uncertain", retry: "same-operation" })

        if (error instanceof HttpError)
          return response(error.status, { error: "request-rejected" })

        if (error instanceof DocumentError) {
          if (error.code === "uncertain")
            return response(503, {
              error: "uncertain",
              retry: "same-operation",
            })

          const status =
            error.code === "invalid"
              ? 400
              : error.code === "denied"
                ? 403
                : error.code === "operation-reuse" || error.code === "mode"
                  ? 409
                  : 503

          return response(status, {
            error: status === 503 ? "unavailable" : error.code,
          })
        }

        return response(503, { error: "unavailable" })
      }
    }

    try {
      const requestInit = {
        signal,
        body: incomingRequest.body,
        duplex: "half" as const,
      }

      return await run(new Request(incomingRequest, requestInit))
    } catch {
      return response(503, { error: "unavailable" })
    } finally {
      clearTimeout(timeout)
      active--
    }
  }
}

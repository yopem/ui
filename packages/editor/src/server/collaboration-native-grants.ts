import {
  editorNativeRoomGrantSchema,
  validateEditorNativeRoomGrant,
} from "@yopem-ui/editor/collaboration/native-model"
import { z } from "zod"

import type {
  EditorAuthentication,
  EditorAuthorizationInput,
  EditorIdentity,
} from "./auth"

import { authorizeEditorRequest } from "./auth"
import { withinSignal } from "./document-service"
import { callableSchema, idSchema } from "./document-validation"

const identitySchema = z.strictObject({
  provider: z.enum(["openauth", "better-auth"]),
  userId: z
    .string()
    .min(1)
    .max(256)
    .refine((value) => value.trim().length > 0),
})

const requestBodySchema = z.strictObject({
  roomId: idSchema,
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[^\p{Cc}]+$/u),
  cursorColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  requestedPermission: z.enum(["read", "write"]),
})

const credentialScopeSchema = z.strictObject({
  roomId: idSchema,
  generation: z.string().regex(/^[a-f0-9]{64}$/),
  identity: identitySchema,
  permission: z.enum(["read", "write"]),
  credentialExpiresAt: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
})

const peerCredentialScopeSchema = z.strictObject({
  room: z
    .string()
    .min(1)
    .max(256)
    .regex(/^[A-Za-z0-9:_-]+$/),
  roomId: idSchema,
  generation: z.string().regex(/^[a-f0-9]{64}$/),
  identity: identitySchema,
  permission: z.enum(["read", "write"]),
  trustedWritersOnly: z.boolean(),
  credentialExpiresAt: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER),
})

const provisionSchema = z.strictObject({
  roomId: idSchema,
  generation: z.string().regex(/^[a-f0-9]{64}$/),
  seeded: z.boolean(),
  identity: identitySchema,
  permission: z.enum(["read", "write"]),
  hocuspocus: z.strictObject({
    token: z
      .string()
      .min(1)
      .max(16384)
      .regex(/^[\x21-\x7e]+$/),
    scope: credentialScopeSchema,
  }),
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[^\p{Cc}]+$/u),
  cursorColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  peer: z
    .strictObject({
      room: z
        .string()
        .min(1)
        .max(256)
        .regex(/^[A-Za-z0-9:_-]+$/),
      password: z
        .string()
        .min(32)
        .max(256)
        .regex(/^[\x21-\x7e]+$/),
      scope: peerCredentialScopeSchema,
    })
    .nullable(),
})

const bodyLimit = 16384

const bodyChunkLimit = 32

const headerLimit = 16384

const pathLimit = 512

const urlLimit = 2048

const grantLifetimeLimit = 300000

export interface EditorNativeRoomCredentialScope {
  roomId: string
  generation: string
  identity: EditorIdentity
  permission: "read" | "write"
  credentialExpiresAt: number
}

export interface EditorNativePeerCredentialScope extends EditorNativeRoomCredentialScope {
  room: string
  trustedWritersOnly: boolean
}

export interface EditorNativeRoomGrantProvision {
  roomId: string
  generation: string
  seeded: boolean
  identity: EditorIdentity
  permission: "read" | "write"
  hocuspocus: {
    token: string
    scope: EditorNativeRoomCredentialScope
  }
  displayName: string
  cursorColor: string
  peer: {
    room: string
    password: string
    scope: EditorNativePeerCredentialScope
  } | null
}

export interface EditorNativeGrantsHttpOptions {
  origin: string
  path: string
  timeoutMs: number
  maxConcurrent: number
  authenticate: EditorAuthentication
  policy(
    this: void,
    input: EditorAuthorizationInput,
  ): boolean | "unavailable" | Promise<boolean | "unavailable">
  verifyCsrf(
    this: void,
    input: {
      request: Request
      identity: EditorIdentity
      token: string
      signal: AbortSignal
    },
  ): boolean | "unavailable" | Promise<boolean | "unavailable">
  provision(
    this: void,
    input: {
      request: Request
      identity: EditorIdentity
      roomId: string
      requestedDisplayName: string
      requestedCursorColor: string
      permission: "read" | "write"
      verifiedCredentialExpiresAt: number
      maximumCredentialExpiresAt: number
      signal: AbortSignal
      deadline: number
    },
  ): EditorNativeRoomGrantProvision | Promise<EditorNativeRoomGrantProvision>
}

class GrantHttpError extends Error {
  constructor(public readonly status: number) {
    super("request rejected")
  }
}

function response(status: number) {
  const error =
    status === 400
      ? "invalid"
      : status === 404
        ? "not-found"
        : status === 405
          ? "method"
          : status === 413
            ? "too-large"
            : status === 415
              ? "unsupported"
              : status === 431
                ? "headers"
                : status === 401 || status === 403
                  ? "denied"
                  : "unavailable"

  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  })

  if (status === 405) headers.set("Allow", "POST")

  return Response.json({ error }, { status, headers })
}

function headerBytes(request: Request) {
  let size = 0
  const encoder = new TextEncoder()

  for (const [name, value] of request.headers) {
    size += encoder.encode(name).byteLength + encoder.encode(value).byteLength

    if (size > headerLimit) return false
  }

  return true
}

function cancelBody(request: Request) {
  const body = request.body

  if (body && !body.locked) void body.cancel().catch(() => undefined)
}

function rejectRequest(request: Request, status: number) {
  cancelBody(request)

  return response(status)
}

function createExecution(
  request: Request,
  timeoutMs: number,
  track: <Value>(work: Promise<Value>) => Promise<Value>,
) {
  const controller = new AbortController()
  const deadline = Date.now() + timeoutMs
  let currentDeadline = deadline
  let credentialExpiresAt: number | undefined
  let timer = setTimeout(() => controller.abort(), timeoutMs)
  const signal = AbortSignal.any([request.signal, controller.signal])

  function check() {
    if (
      credentialExpiresAt !== undefined &&
      credentialExpiresAt <= Date.now()
    ) {
      controller.abort()
      throw new GrantHttpError(401)
    }

    if (Date.now() >= currentDeadline) controller.abort()

    if (signal.aborted) throw new GrantHttpError(503)
  }

  function setCredentialExpiresAt(expiresAt: number) {
    credentialExpiresAt = expiresAt
    currentDeadline = Math.min(currentDeadline, expiresAt)
    clearTimeout(timer)
    timer = setTimeout(
      () => controller.abort(),
      Math.max(0, currentDeadline - Date.now()),
    )
    check()
  }

  async function invoke<Value>(callback: () => Value | Promise<Value>) {
    check()

    const work = track(Promise.resolve(callback()))

    const value = await withinSignal(work, signal)
    check()

    return value
  }

  try {
    const requestInit: RequestInit & { duplex: "half" } = {
      method: "POST",
      signal,
      body: request.body,
      duplex: "half",
    }

    const controlledRequest = new Request(request, requestInit)

    return {
      request: controlledRequest,
      signal,
      get deadline() {
        return currentDeadline
      },
      check,
      invoke,
      setCredentialExpiresAt,
      credentialExpired() {
        return (
          credentialExpiresAt !== undefined && credentialExpiresAt <= Date.now()
        )
      },
      close() {
        clearTimeout(timer)
      },
    }
  } catch (error) {
    clearTimeout(timer)
    throw error
  }
}

async function readBody(
  request: Request,
  signal: AbortSignal,
  check: () => void,
) {
  const length = request.headers.get("content-length")

  if (
    length !== null &&
    (!/^(0|[1-9][0-9]*)$/.test(length) || Number(length) > bodyLimit)
  )
    throw new GrantHttpError(413)

  if (!request.body) throw new GrantHttpError(400)

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  try {
    for (;;) {
      check()
      const result = await withinSignal(reader.read(), signal)
      check()

      if (result.done) break

      if (
        chunks.length >= bodyChunkLimit ||
        size + result.value.byteLength > bodyLimit
      )
        throw new GrantHttpError(413)

      chunks.push(result.value.slice())
      size += result.value.byteLength
    }
  } finally {
    void reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }

  if (length !== null && Number(length) !== size) throw new GrantHttpError(400)

  const bytes = new Uint8Array(size)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  let text: string

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    throw new GrantHttpError(400)
  }

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
      if (++depth > 16) throw new GrantHttpError(413)
    } else if (character === "}" || character === "]") {
      if (--depth < 0) throw new GrantHttpError(400)
    }
  }

  try {
    const parsed = requestBodySchema.safeParse(JSON.parse(text))

    if (!parsed.success) throw new GrantHttpError(400)

    return { input: parsed.data, bytes }
  } catch (error) {
    if (error instanceof GrantHttpError) throw error
    throw new GrantHttpError(400)
  }
}

function createCallbackRequest(
  request: Request,
  bytes: Uint8Array,
  signal: AbortSignal,
) {
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: bytes.slice(),
    signal,
  })
}

export function createEditorNativeGrantsHttpHandler(
  options: EditorNativeGrantsHttpOptions,
) {
  let origin: URL

  try {
    origin = new URL(options.origin)
  } catch {
    throw new Error("native collaboration grant configuration rejected")
  }

  if (
    options.origin.length > 512 ||
    origin.origin !== options.origin ||
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    options.path.length < 2 ||
    options.path.length > pathLimit ||
    !/^\/[A-Za-z0-9/_-]+$/.test(options.path) ||
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 30000 ||
    !Number.isSafeInteger(options.maxConcurrent) ||
    options.maxConcurrent < 1 ||
    options.maxConcurrent > 64 ||
    !callableSchema.safeParse(options.authenticate).success ||
    !callableSchema.safeParse(options.policy).success ||
    !callableSchema.safeParse(options.verifyCsrf).success ||
    !callableSchema.safeParse(options.provision).success
  )
    throw new Error("native collaboration grant configuration rejected")

  const endpoint = `${options.origin}${options.path}`
  let active = 0
  let pending = 0

  function track<Value>(work: Promise<Value>) {
    pending++

    return work.finally(() => {
      pending--
    })
  }

  return async function handleNativeGrantRequest(
    request: Request,
  ): Promise<Response> {
    if (request.url.length > urlLimit) return rejectRequest(request, 400)

    let url: URL

    try {
      url = new URL(request.url)
    } catch {
      return rejectRequest(request, 400)
    }

    if (
      url.origin !== options.origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      request.headers.get("Origin") !== options.origin
    )
      return rejectRequest(request, 403)

    if (url.pathname !== options.path) return rejectRequest(request, 404)

    if (url.href !== endpoint) return rejectRequest(request, 403)

    if (request.method !== "POST") return rejectRequest(request, 405)

    if (!headerBytes(request)) return rejectRequest(request, 431)

    if (
      !/^application\/json(?:;\s*charset=utf-8)?$/i.test(
        request.headers.get("content-type") ?? "",
      ) ||
      request.headers.has("content-encoding")
    )
      return rejectRequest(request, 415)

    if (Math.max(active, pending) >= options.maxConcurrent)
      return rejectRequest(request, 503)

    active++
    let execution: ReturnType<typeof createExecution> | undefined
    const cleanupRequests: Request[] = []

    try {
      const currentExecution = createExecution(
        request,
        options.timeoutMs,
        track,
      )

      execution = currentExecution
      currentExecution.check()

      const { input, bytes } = await readBody(
        currentExecution.request,
        currentExecution.signal,
        currentExecution.check,
      )

      function callbackRequest() {
        const callback = createCallbackRequest(
          currentExecution.request,
          bytes,
          currentExecution.signal,
        )

        cleanupRequests.push(callback)

        return callback
      }

      const action =
        input.requestedPermission === "write" ? "collab:write" : "collab:read"

      currentExecution.check()

      const authorization = await withinSignal(
        authorizeEditorRequest({
          request: currentExecution.request,
          documentId: input.roomId,
          action,
          authenticate: async function authenticate() {
            return await currentExecution.invoke(async () => {
              const result = await options.authenticate(callbackRequest())

              if (result.status !== "authenticated") return result

              const identityResult = identitySchema.safeParse(result.identity)
              const expiresAt = result.credentialExpiresAt

              if (
                !identityResult.success ||
                !Number.isSafeInteger(expiresAt) ||
                expiresAt === undefined ||
                expiresAt <= Date.now()
              )
                return { status: "unauthenticated" }

              currentExecution.setCredentialExpiresAt(expiresAt)
              const identity = identityResult.data
              Object.freeze(identity)

              return {
                status: "authenticated",
                identity,
                credentialExpiresAt: expiresAt,
              }
            })
          },
          policy: async function authorize(input) {
            const identity: EditorIdentity = { ...input.identity }
            Object.freeze(identity)

            return await currentExecution.invoke(() =>
              options.policy({
                ...input,
                request: callbackRequest(),
                identity,
              }),
            )
          },
        }),
        currentExecution.signal,
      )

      currentExecution.check()

      if (currentExecution.credentialExpired()) throw new GrantHttpError(401)

      if (authorization.status !== "authorized")
        throw new GrantHttpError(authorization.statusCode)

      const verifiedCredentialExpiresAt = authorization.credentialExpiresAt

      if (
        verifiedCredentialExpiresAt === undefined ||
        !Number.isSafeInteger(verifiedCredentialExpiresAt) ||
        verifiedCredentialExpiresAt <= Date.now()
      )
        throw new GrantHttpError(401)

      currentExecution.setCredentialExpiresAt(verifiedCredentialExpiresAt)
      const identityResult = identitySchema.safeParse(authorization.identity)

      if (!identityResult.success) throw new GrantHttpError(401)

      const identity = identityResult.data
      Object.freeze(identity)
      const csrfToken = currentExecution.request.headers.get("x-csrf-token")

      if (
        !csrfToken ||
        csrfToken.length > 2048 ||
        !/^[\x21-\x7e]+$/.test(csrfToken)
      )
        throw new GrantHttpError(403)

      const csrf = await currentExecution.invoke(() =>
        options.verifyCsrf({
          request: callbackRequest(),
          identity,
          token: csrfToken,
          signal: currentExecution.signal,
        }),
      )

      if (csrf !== true)
        throw new GrantHttpError(csrf === "unavailable" ? 503 : 403)

      const now = Date.now()

      const maximumCredentialExpiresAt = Math.min(
        now + grantLifetimeLimit,
        verifiedCredentialExpiresAt,
      )

      if (maximumCredentialExpiresAt <= now) throw new GrantHttpError(401)

      const material = await currentExecution.invoke(() =>
        options.provision({
          request: callbackRequest(),
          identity,
          roomId: input.roomId,
          requestedDisplayName: input.displayName,
          requestedCursorColor: input.cursorColor,
          permission: input.requestedPermission,
          verifiedCredentialExpiresAt,
          maximumCredentialExpiresAt,
          signal: currentExecution.signal,
          deadline: Math.min(
            currentExecution.deadline,
            maximumCredentialExpiresAt,
          ),
        }),
      )

      const parsedMaterial = provisionSchema.safeParse(material)

      if (!parsedMaterial.success) throw new GrantHttpError(403)

      const value = parsedMaterial.data
      const credentialExpiresAt = value.hocuspocus.scope.credentialExpiresAt

      function matchesScope(
        scope: z.infer<typeof credentialScopeSchema>,
        permission: "read" | "write",
      ) {
        return (
          scope.roomId === value.roomId &&
          scope.generation === value.generation &&
          scope.identity.provider === identity.provider &&
          scope.identity.userId === identity.userId &&
          scope.permission === permission &&
          scope.credentialExpiresAt <= maximumCredentialExpiresAt
        )
      }

      if (
        value.seeded !== true ||
        value.roomId !== input.roomId ||
        value.permission !== input.requestedPermission ||
        value.identity.provider !== identity.provider ||
        value.identity.userId !== identity.userId ||
        !matchesScope(value.hocuspocus.scope, value.permission) ||
        credentialExpiresAt <= Date.now() ||
        (value.peer !== null &&
          (value.permission !== "write" ||
            value.peer.scope.room !== value.peer.room ||
            value.peer.scope.trustedWritersOnly !== true ||
            !matchesScope(value.peer.scope, "write") ||
            value.peer.scope.credentialExpiresAt !== credentialExpiresAt))
      )
        throw new GrantHttpError(403)

      const candidate = {
        roomId: value.roomId,
        generation: value.generation,
        seeded: true,
        permission: value.permission,
        credentialExpiresAt,
        hocuspocusToken: value.hocuspocus.token,
        displayName: value.displayName,
        cursorColor: value.cursorColor,
        peer:
          value.peer === null
            ? null
            : {
                room: value.peer.room,
                password: value.peer.password,
                trustedWritersOnly: value.peer.scope.trustedWritersOnly,
              },
      }

      const grant = editorNativeRoomGrantSchema.safeParse(candidate)

      if (!grant.success) throw new GrantHttpError(403)

      try {
        validateEditorNativeRoomGrant(grant.data, input.roomId, Date.now())
      } catch {
        throw new GrantHttpError(403)
      }

      currentExecution.check()

      return Response.json(grant.data, {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      })
    } catch (error) {
      if (error instanceof GrantHttpError) return response(error.status)

      if (execution?.credentialExpired()) return response(401)

      return response(503)
    } finally {
      if (execution) {
        execution.close()
        cancelBody(execution.request)
      }

      for (const cleanupRequest of cleanupRequests) cancelBody(cleanupRequest)
      active--
    }
  }
}

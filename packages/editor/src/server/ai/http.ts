import { authorizeEditorRequest } from "@yopem-ui/editor/server"
import { z } from "zod"

import type { AiHandlerOptions, AiInput } from "./contracts"

import { isConfiguredProvider } from "./providers"
import { AiFailure, checkAiDeadline, untilAbort } from "./streams"

const inputSchema = z
  .strictObject({
    documentId: z
      .string()
      .min(1)
      .max(256)
      .refine((value) =>
        value
          .split("")
          .every(
            (character) =>
              character.charCodeAt(0) > 32 && character.charCodeAt(0) !== 127,
          ),
      ),
    operation: z.enum(["generate", "rewrite", "copilot"]),
    instruction: z.string().min(1).max(16_384),
    selectedText: z.string().max(32_768).default(""),
    context: z.string().max(32_768).default(""),
  })
  .refine(
    (input) => input.operation !== "rewrite" || input.selectedText.length > 0,
  )

const encoder = new TextEncoder()

export function createEditorAiHandler(options: AiHandlerOptions) {
  const origin = new URL(options.trustedOrigin)

  if (
    origin.protocol !== "https:" ||
    origin.origin !== options.trustedOrigin ||
    !isConfiguredProvider(options.provider) ||
    ![
      options.authenticate,
      options.policy,
      options.verifyCsrf,
      options.reserve,
    ].every((callback) => z.function().safeParse(callback).success) ||
    !Number.isSafeInteger(options.maxDurationMs) ||
    options.maxDurationMs < 1 ||
    options.maxDurationMs > 120_000 ||
    !Number.isSafeInteger(options.maxInputBytes) ||
    options.maxInputBytes < 1 ||
    options.maxInputBytes > 131_072 ||
    !Number.isSafeInteger(options.maxOutputBytes) ||
    options.maxOutputBytes < 1 ||
    options.maxOutputBytes > 1_048_576
  )
    throw new Error("invalid_configuration")
  const config = { ...options }

  return async function handleEditorAi(request: Request): Promise<Response> {
    const headers = new Headers({
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      vary: "Origin",
    })

    function reject(status: number, code: string) {
      return Response.json({ code }, { status, headers })
    }

    if (request.headers.get("origin") !== config.trustedOrigin)
      return reject(403, "origin_denied")
    headers.set("access-control-allow-origin", config.trustedOrigin)
    headers.set("access-control-allow-credentials", "true")

    if (request.method === "OPTIONS") {
      const requested =
        request.headers
          .get("access-control-request-headers")
          ?.toLowerCase()
          .split(",")
          .map((value) => value.trim()) ?? []

      if (
        request.headers.get("access-control-request-method") !== "POST" ||
        requested.some(
          (value) =>
            ![
              "authorization",
              "content-type",
              "x-editor-request",
              "x-csrf-token",
            ].includes(value),
        )
      )
        return reject(403, "cors_denied")
      headers.set("access-control-allow-methods", "POST")
      headers.set(
        "access-control-allow-headers",
        "Authorization, Content-Type, X-Editor-Request, X-CSRF-Token",
      )

      return new Response(null, { status: 204, headers })
    }

    if (request.method !== "POST") return reject(405, "method_denied")

    if (request.headers.get("x-editor-request") !== "1")
      return reject(403, "csrf_denied")

    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() !== "application/json"
    )
      return reject(415, "unsupported_type")
    const controller = new AbortController()
    const signal = controller.signal

    function disconnected() {
      controller.abort(new AiFailure("cancelled"))
    }

    request.signal.addEventListener("abort", disconnected, { once: true })

    if (request.signal.aborted) disconnected()
    let deadline = Date.now() + config.maxDurationMs

    let deadlineCode: "deadline" | "credential_expired" = "deadline"

    let timer = setTimeout(
      () => controller.abort(new AiFailure("deadline")),
      config.maxDurationMs,
    )

    function checkDeadlineAbort() {
      if (!signal.aborted && Date.now() >= deadline)
        controller.abort(new AiFailure(deadlineCode))
    }

    function checkActive() {
      checkDeadlineAbort()
      checkAiDeadline(signal, deadline)
    }

    function cleanup() {
      clearTimeout(timer)
      request.signal.removeEventListener("abort", disconnected)
    }

    let transferred = false

    try {
      const linkedInit: RequestInit & { duplex?: "half" } = {
        signal,
        body: request.body,
      }

      if (request.body) linkedInit.duplex = "half"
      const linkedRequest = new Request(request, linkedInit)

      checkActive()
      const csrf = await untilAbort(config.verifyCsrf(linkedRequest), signal)
      checkActive()

      if (csrf !== true) return reject(403, "csrf_denied")

      const received = await readInput(
        linkedRequest,
        config.maxInputBytes,
        signal,
        deadline,
      )

      checkActive()

      if (received === "oversized") return reject(413, "input_limit")
      const parsed = inputSchema.safeParse(JSON.parse(received))

      if (
        !parsed.success ||
        encoder.encode(parsed.data.documentId).length > 256
      )
        return reject(400, "invalid_input")
      const input: AiInput = parsed.data

      checkActive()

      const authorization = await untilAbort(
        authorizeEditorRequest({
          request: linkedRequest,
          documentId: input.documentId,
          action: "ai:invoke",
          async authenticate(callbackRequest) {
            checkActive()
            const authentication = await config.authenticate(callbackRequest)
            checkActive()

            return authentication
          },
          async policy(input) {
            checkActive()
            const decision = await config.policy(input)
            checkActive()

            return decision
          },
        }),
        signal,
      )

      checkActive()

      if (authorization.status !== "authorized")
        return reject(authorization.statusCode, "access_denied")
      const expires = authorization.credentialExpiresAt

      if (expires === undefined || expires <= Date.now())
        return reject(401, "access_denied")

      if (expires < deadline) {
        deadline = expires
        deadlineCode = "credential_expired"
        clearTimeout(timer)
        timer = setTimeout(
          () => controller.abort(new AiFailure("credential_expired")),
          expires - Date.now(),
        )
      }

      checkActive()

      const reservation = await untilAbort(
        config.reserve({
          identity: authorization.identity,
          documentId: input.documentId,
          maxTokens: config.provider.maxTokens,
          signal,
        }),
        signal,
      )

      checkActive()

      if (reservation !== "reserved")
        return reject(reservation === "denied" ? 429 : 503, "quota_unavailable")
      checkActive()

      if (expires <= Date.now()) return reject(401, "access_denied")

      const events = await untilAbort(
        config.provider.open(input, signal, deadline),
        signal,
      )

      checkActive()
      let outputBytes = 0
      let closed = false

      function encode(
        event: string,
        value: { text: string } | { version: number } | { code: string },
      ) {
        return encoder.encode(
          `event: ${event}\ndata: ${JSON.stringify(value)}\n\n`,
        )
      }

      const body = new ReadableStream<Uint8Array>(
        {
          start(stream) {
            signal.addEventListener(
              "abort",
              () => {
                if (closed) return
                closed = true

                const code =
                  signal.reason instanceof AiFailure
                    ? signal.reason.code
                    : "cancelled"

                stream.enqueue(encode("error", { code }))
                stream.close()
                cleanup()
                events.return(undefined).catch(() => undefined)
              },
              { once: true },
            )
          },
          async pull(stream) {
            try {
              checkActive()
              const result = await untilAbort(events.next(), signal)

              if (closed) return
              checkActive()

              if (result.done) throw new AiFailure("truncated")

              if (result.value.type === "complete") {
                await untilAbort(events.return(undefined), signal)

                if (closed) return
                checkActive()
                closed = true
                stream.enqueue(encode("complete", { version: 1 }))
                stream.close()
                cleanup()
                controller.abort()

                return
              }

              outputBytes += encoder.encode(result.value.text).byteLength

              if (outputBytes > config.maxOutputBytes)
                throw new AiFailure("output_limit")
              stream.enqueue(encode("text", { text: result.value.text }))
            } catch (error) {
              checkDeadlineAbort()

              if (closed) return
              closed = true
              stream.enqueue(
                encode("error", {
                  code:
                    error instanceof AiFailure
                      ? error.code
                      : "provider_unavailable",
                }),
              )
              stream.close()
              controller.abort()
              cleanup()
              await events.return(undefined).catch(() => undefined)
            }
          },
          async cancel() {
            closed = true
            disconnected()
            cleanup()
            await events.return(undefined).catch(() => undefined)
          },
        },
        { highWaterMark: 0 },
      )

      headers.set("content-type", "text/event-stream; charset=utf-8")
      headers.set("x-accel-buffering", "no")
      transferred = true

      return new Response(body, { headers })
    } catch (error) {
      checkDeadlineAbort()

      if (signal.aborted && signal.reason instanceof AiFailure)
        return reject(503, signal.reason.code)

      if (error instanceof SyntaxError) return reject(400, "invalid_input")

      return reject(
        503,
        error instanceof AiFailure ? error.code : "dependency_unavailable",
      )
    } finally {
      if (!transferred) {
        cleanup()

        if (signal.aborted) request.body?.cancel().catch(() => undefined)
        controller.abort()
      }
    }
  }
}

async function readInput(
  request: Request,
  limit: number,
  signal: AbortSignal,
  deadline: number,
) {
  const declared = request.headers.get("content-length")

  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit))
    return "oversized"
  const reader = request.body?.getReader()

  if (!reader) return ""
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let text = ""
  let bytes = 0

  try {
    while (true) {
      checkAiDeadline(signal, deadline)
      const result = await untilAbort(reader.read(), signal)
      checkAiDeadline(signal, deadline)

      if (result.done) return text + decoder.decode()
      bytes += result.value.byteLength

      if (bytes > limit) return "oversized"
      text += decoder.decode(result.value, { stream: true })
    }
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

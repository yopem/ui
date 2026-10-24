import { z } from "zod"

const eventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("text"),
    value: z.strictObject({ text: z.string() }),
  }),
  z.object({
    event: z.literal("complete"),
    value: z.strictObject({ version: z.literal(1) }),
  }),
  z.object({
    event: z.literal("error"),
    value: z.strictObject({
      code: z.enum([
        "truncated",
        "invalid_stream",
        "provider_unavailable",
        "output_limit",
        "deadline",
        "credential_expired",
        "cancelled",
      ]),
    }),
  }),
])

export type EditorAiOperation = "generate" | "rewrite" | "copilot"

export interface EditorAiConfig {
  endpoint: string
  documentId: string
  headers: () => HeadersInit | Promise<HeadersInit>
  timeoutMs?: number
}

export interface EditorAiInput {
  operation: EditorAiOperation
  instruction: string
  selectedText: string
  context: string
}

function checkAiDeadline(signal: AbortSignal, deadline: number) {
  if (signal.aborted)
    throw new Error(signal.reason === "deadline" ? "deadline" : "cancelled")

  if (Date.now() >= deadline) throw new Error("deadline")
}

function untilAbort<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    function abort() {
      reject(new Error(signal.reason === "deadline" ? "deadline" : "cancelled"))
    }

    if (signal.aborted) {
      abort()

      return
    }

    signal.addEventListener("abort", abort, { once: true })
    pending
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", abort))
      .catch(() => undefined)
  })
}

export function validateEditorAiConfig(config: EditorAiConfig, origin: string) {
  const url = new URL(config.endpoint, origin)

  if (
    url.origin !== origin ||
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !config.endpoint.trim() ||
    !config.documentId ||
    new TextEncoder().encode(config.documentId).length > 256 ||
    config.documentId
      .split("")
      .some(
        (character) =>
          character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
      ) ||
    !z.function().safeParse(config.headers).success ||
    !Number.isSafeInteger(config.timeoutMs ?? 60_000) ||
    (config.timeoutMs ?? 60_000) < 1 ||
    (config.timeoutMs ?? 60_000) > 120_000
  )
    throw new Error("invalid_configuration")

  return url.href
}

export async function requestEditorAi(
  config: EditorAiConfig,
  input: EditorAiInput,
  origin: string,
  signal: AbortSignal,
  onText: (text: string) => void,
  transport: (url: string, init: RequestInit) => Promise<Response> = fetch,
) {
  const endpoint = validateEditorAiConfig(config, origin)

  if (
    !["generate", "rewrite", "copilot"].includes(input.operation) ||
    !input.instruction.trim() ||
    input.instruction.length > 16_384 ||
    input.selectedText.length > 32_768 ||
    input.context.length > 32_768 ||
    (input.operation === "rewrite" && !input.selectedText)
  )
    throw new Error("invalid_input")
  const controller = new AbortController()

  function cancel() {
    controller.abort()
  }

  signal.addEventListener("abort", cancel, { once: true })

  if (signal.aborted) cancel()

  const deadline = Date.now() + (config.timeoutMs ?? 60_000)

  const timer = setTimeout(
    () => controller.abort("deadline"),
    config.timeoutMs ?? 60_000,
  )

  try {
    checkAiDeadline(controller.signal, deadline)

    const headers = new Headers(
      await untilAbort(
        Promise.resolve().then(() => {
          checkAiDeadline(controller.signal, deadline)

          return config.headers()
        }),
        controller.signal,
      ),
    )

    checkAiDeadline(controller.signal, deadline)
    headers.set("content-type", "application/json")
    headers.set("accept", "text/event-stream")
    headers.set("x-editor-request", "1")

    const body = JSON.stringify({
      operation: input.operation,
      instruction: input.instruction,
      selectedText: input.selectedText,
      context: input.context,
      documentId: config.documentId,
    })

    if (new TextEncoder().encode(body).length > 131_072)
      throw new Error("input_limit")

    checkAiDeadline(controller.signal, deadline)

    const pending = transport(endpoint, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
    })

    pending
      .then((response) => {
        if (controller.signal.aborted)
          return response.body?.cancel().catch(() => undefined)
      })
      .catch(() => undefined)
    const response = await untilAbort(pending, controller.signal)

    try {
      checkAiDeadline(controller.signal, deadline)
    } catch (error) {
      await response.body?.cancel().catch(() => undefined)
      throw error
    }

    if (
      !response.ok ||
      response.redirected ||
      !response.body ||
      response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() !== "text/event-stream"
    ) {
      await response.body?.cancel().catch(() => undefined)
      throw new Error("request_failed")
    }

    const proposal = await readEditorAiProposal(
      response.body,
      controller.signal,
      onText,
      deadline,
    )

    checkAiDeadline(controller.signal, deadline)

    return proposal
  } finally {
    clearTimeout(timer)
    signal.removeEventListener("abort", cancel)
    controller.abort()
  }
}

export async function readEditorAiProposal(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onText: (text: string) => void,
  deadline = Infinity,
) {
  const reader = body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  const encoder = new TextEncoder()
  let line = ""
  let event = ""
  let eventSeen = false
  let data: string[] = []
  let skipLf = false
  let frameBytes = 0
  let wireBytes = 0
  let outputBytes = 0
  let proposal = ""
  let completed = false

  function frame() {
    if (!data.length) {
      if (event) throw new Error("invalid_stream")

      return
    }

    if (completed) throw new Error("invalid_stream")
    const value: unknown = JSON.parse(data.join("\n"))
    const parsed = eventSchema.safeParse({ event, value })

    if (!parsed.success)
      throw new Error(event === "error" ? "request_failed" : "invalid_stream")

    if (parsed.data.event === "text") {
      outputBytes += encoder.encode(parsed.data.value.text).length

      if (outputBytes > 1_048_576) throw new Error("output_limit")
      proposal += parsed.data.value.text
      checkAiDeadline(signal, deadline)
      onText(proposal)
      checkAiDeadline(signal, deadline)
    } else if (parsed.data.event === "error")
      throw new Error(parsed.data.value.code)
    else completed = true
  }

  function finishLine() {
    if (!line) {
      frame()
      event = ""
      eventSeen = false
      data = []
      frameBytes = 0
    } else if (!line.startsWith(":")) {
      const colon = line.indexOf(":")
      const field = colon < 0 ? line : line.slice(0, colon)
      const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /u, "")

      if (field === "event") {
        if (eventSeen) throw new Error("invalid_stream")
        eventSeen = true
        event = value
      } else if (field === "data") data.push(value)
      else throw new Error("invalid_stream")
    }

    line = ""
  }

  try {
    while (true) {
      checkAiDeadline(signal, deadline)
      const result = await untilAbort(reader.read(), signal)
      checkAiDeadline(signal, deadline)

      if (result.done) {
        decoder.decode()

        if (skipLf) finishLine()
        checkAiDeadline(signal, deadline)

        if (!completed || line || data.length || event)
          throw new Error("truncated")

        return proposal
      }

      wireBytes += result.value.byteLength

      if (wireBytes > 2_097_152) throw new Error("output_limit")

      for (const character of decoder.decode(result.value, { stream: true })) {
        checkAiDeadline(signal, deadline)

        if (skipLf) {
          skipLf = false

          if (character === "\n" && ++frameBytes > 65_536)
            throw new Error("output_limit")
          finishLine()

          if (character === "\n") continue
        }

        frameBytes += encoder.encode(character).length

        if (frameBytes > 65_536) throw new Error("output_limit")

        if (character === "\r") skipLf = true
        else if (character === "\n") finishLine()
        else line += character
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

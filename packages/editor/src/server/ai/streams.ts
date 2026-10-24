export class AiFailure extends Error {
  constructor(
    readonly code:
      | "provider_unavailable"
      | "invalid_stream"
      | "truncated"
      | "output_limit"
      | "deadline"
      | "credential_expired"
      | "cancelled",
  ) {
    super(code)
  }
}

export function checkAiDeadline(signal: AbortSignal, deadline = Infinity) {
  signal.throwIfAborted()

  if (Date.now() >= deadline) throw new AiFailure("deadline")
}

export function untilAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    function aborted() {
      reject(
        signal.reason instanceof AiFailure
          ? signal.reason
          : new AiFailure("cancelled"),
      )
    }

    if (signal.aborted) {
      aborted()

      return
    }

    signal.addEventListener("abort", aborted, { once: true })
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", aborted))
      .catch(() => undefined)
  })
}

export async function* readSse(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  deadline = Infinity,
) {
  const reader = body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })
  let buffer = ""
  let data: string[] = []
  let event = ""
  let frameSize = 0
  let total = 0
  let skipLf = false
  let first = true

  function finishLine() {
    const line = buffer
    buffer = ""

    if (!line) {
      const frame = data.length ? { event, data: data.join("\n") } : undefined
      data = []
      event = ""
      frameSize = 0

      return frame
    }

    if (!line.startsWith(":")) {
      const colon = line.indexOf(":")
      const field = colon < 0 ? line : line.slice(0, colon)
      const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "")

      if (field === "data") data.push(value)

      if (field === "event") event = value
    }
  }

  try {
    while (true) {
      checkAiDeadline(signal, deadline)
      const result = await untilAbort(reader.read(), signal)
      checkAiDeadline(signal, deadline)

      if (result.done) {
        decoder.decode()

        if (skipLf) {
          const frame = finishLine()

          if (frame) yield frame
        }

        return
      }

      total += result.value.byteLength

      if (total > 2_097_152) throw new AiFailure("output_limit")
      const chunk = decoder.decode(result.value, { stream: true })

      for (const character of chunk) {
        checkAiDeadline(signal, deadline)

        if (skipLf) {
          skipLf = false

          if (character === "\n" && ++frameSize > 65_536)
            throw new AiFailure("invalid_stream")
          const frame = finishLine()

          if (frame) yield frame

          if (character === "\n") continue
        }

        const code = character.codePointAt(0) ?? 0
        frameSize += code > 0xffff ? 4 : code > 0x7ff ? 3 : code > 0x7f ? 2 : 1

        if (frameSize > 65_536) throw new AiFailure("invalid_stream")

        if (first) {
          first = false

          if (character === "\uFEFF") continue
        }

        if (character === "\r") skipLf = true
        else if (character === "\n") {
          const frame = finishLine()

          if (frame) yield frame
        } else buffer += character
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

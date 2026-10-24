import { createEditorAiHandler } from "@editor/server/ai/http"
import { createOpenAiProvider } from "@editor/server/ai/providers"
import { expect, test } from "bun:test"

for (const mode of ["deadline", "disconnect"] as const) {
  test(`linked Request preserves source body cancellation: ${mode}`, async () => {
    let cancelled = false
    let linked: Request | undefined
    const incoming = new AbortController()
    const started = Promise.withResolvers<void>()

    const source = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true
      },
    })

    const init: RequestInit & { duplex: "half" } = {
      method: "POST",
      duplex: "half",
      body: source,
      signal: incoming.signal,
      headers: {
        origin: "https://editor.example",
        "content-type": "application/json",
        "x-editor-request": "1",
      },
    }

    const request = new Request("https://editor.example/ai", init)

    const handler = createEditorAiHandler({
      trustedOrigin: "https://editor.example",
      provider: createOpenAiProvider({
        apiKey: "fixture",
        model: "host",
        system: "host",
        maxTokens: 8,
        transport: () => Promise.reject(new Error("unexpected provider")),
      }),
      verifyCsrf(callbackRequest) {
        linked = callbackRequest
        started.resolve()

        return Promise.resolve(true)
      },
      authenticate: () => Promise.reject(new Error("unexpected auth")),
      policy: () => Promise.resolve(false),
      reserve: () => Promise.resolve("denied"),
      maxDurationMs: mode === "deadline" ? 30 : 1000,
      maxInputBytes: 1024,
      maxOutputBytes: 1024,
    })

    const pending = handler(request)
    await started.promise

    if (mode === "disconnect") incoming.abort()
    const response = await pending
    expect(response.status).toBe(503)
    expect(linked?.body).toBe(request.body)
    expect(linked?.signal.aborted).toBe(true)
    expect(cancelled).toBe(true)
    expect(request.body?.locked).toBe(false)
  })
}

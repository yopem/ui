import { requestEditorAi } from "@editor/ai-client"
import { createEditorAiHandler } from "@editor/server/ai/http"
import { createOpenAiProvider } from "@editor/server/ai/providers"
import assert from "node:assert/strict"

const observations: object[] = []

for (const stage of ["csrf", "authenticate", "policy", "reserve"] as const) {
  const started = Date.now()
  const calls: { name: string; elapsed: number }[] = []

  function record(name: string) {
    calls.push({ name, elapsed: Date.now() - started })

    if (name === stage) {
      const until = Date.now() + 100

      while (Date.now() < until) {
        Math.sqrt(Date.now())
      }
    }
  }

  const provider = createOpenAiProvider({
    apiKey: "fixture-not-secret",
    model: "fixture",
    system: "fixture",
    maxTokens: 1,
    transport() {
      record("transport")

      return Promise.resolve(
        new Response(
          'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
          { headers: { "content-type": "text/event-stream" } },
        ),
      )
    },
  })

  const handle = createEditorAiHandler({
    trustedOrigin: "https://editor.test",
    provider,
    maxDurationMs: 20,
    maxInputBytes: 4096,
    maxOutputBytes: 4096,
    verifyCsrf() {
      record("csrf")

      return Promise.resolve(true)
    },
    authenticate() {
      record("authenticate")

      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "better-auth", userId: "fixture-user" },
        credentialExpiresAt: Date.now() + 60000,
      })
    },
    policy() {
      record("policy")

      return Promise.resolve(true)
    },
    reserve() {
      record("reserve")

      return Promise.resolve("reserved")
    },
  })

  const response = await handle(
    new Request("https://editor.test/ai", {
      method: "POST",
      headers: {
        origin: "https://editor.test",
        "content-type": "application/json",
        "x-editor-request": "1",
      },
      body: JSON.stringify({
        documentId: "doc-1",
        operation: "generate",
        instruction: "fixture",
      }),
    }),
  )

  const body = await response.text()

  const lateTransport = calls.some(
    (call) => call.name === "transport" && call.elapsed >= 100,
  )

  observations.push({
    stage,
    status: response.status,
    calls,
    completed: body.includes("event: complete"),
    lateTransport,
  })
  assert.equal(lateTransport, false)
  assert.equal(response.status, 503)
  assert.equal(JSON.parse(body).code, "deadline")
  assert.equal(calls.at(-1)?.name, stage)
}

const clientStarted = Date.now()

let clientTransportElapsed = 0

await assert.rejects(
  requestEditorAi(
    {
      endpoint: "/ai",
      documentId: "doc-1",
      timeoutMs: 20,
      headers() {
        const until = Date.now() + 100

        while (Date.now() < until) {
          Math.sqrt(Date.now())
        }

        return {}
      },
    },
    {
      operation: "generate",
      instruction: "fixture",
      selectedText: "",
      context: "",
    },
    "https://editor.test",
    new AbortController().signal,
    () => undefined,
    () => {
      clientTransportElapsed = Date.now() - clientStarted

      return Promise.resolve(
        new Response(
          'event: text\ndata: {"text":"fixture"}\n\nevent: complete\ndata: {"version":1}\n\n',
          { headers: { "content-type": "text/event-stream" } },
        ),
      )
    },
  ),
  /deadline/,
)

assert.equal(clientTransportElapsed, 0)

console.info(
  JSON.stringify(
    {
      runtime: process.versions,
      observations,
      client: { clientTransportElapsed },
    },
    null,
    2,
  ),
)

for (const stage of ["transport", "pull", "eof", "onText"] as const) {
  let cancelled = 0
  let read = 0

  function block() {
    const end = Date.now() + 100

    while (Date.now() < end) {
      Math.sqrt(Date.now())
    }
  }

  await assert.rejects(
    requestEditorAi(
      {
        endpoint: "/ai",
        documentId: "doc-1",
        timeoutMs: 20,
        headers() {
          return {}
        },
      },
      {
        operation: "generate",
        instruction: "fixture",
        selectedText: "",
        context: "",
      },
      "https://editor.test",
      new AbortController().signal,
      () => {
        if (stage === "onText") block()
      },
      () => {
        if (stage === "transport") block()

        return Promise.resolve(
          new Response(
            new ReadableStream<Uint8Array>(
              {
                pull(controller) {
                  if (read++ === 0) {
                    if (stage === "pull") block()
                    controller.enqueue(
                      new TextEncoder().encode(
                        'event: text\ndata: {"text":"fixture"}\n\nevent: complete\ndata: {"version":1}\n\n',
                      ),
                    )
                  } else {
                    if (stage === "eof") block()
                    controller.close()
                  }
                },
                cancel() {
                  cancelled++
                },
              },
              { highWaterMark: 0 },
            ),
            { headers: { "content-type": "text/event-stream" } },
          ),
        )
      },
    ),
    /deadline/,
  )
  console.info(JSON.stringify({ stage, cancelled }))
}

for (const stage of ["transport", "pull"] as const) {
  let calls = 0
  let cancelled = 0

  function block() {
    const end = Date.now() + 100

    while (Date.now() < end) {
      Math.sqrt(Date.now())
    }
  }

  const provider = createOpenAiProvider({
    apiKey: "fixture",
    model: "fixture",
    system: "fixture",
    maxTokens: 1,
    transport() {
      calls++

      if (stage === "transport") block()

      return Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>(
            {
              pull(controller) {
                if (stage === "pull") block()
                controller.enqueue(
                  new TextEncoder().encode(
                    'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
                  ),
                )
              },
              cancel() {
                cancelled++
              },
            },
            { highWaterMark: 0 },
          ),
          { headers: { "content-type": "text/event-stream" } },
        ),
      )
    },
  })

  const handle = createEditorAiHandler({
    trustedOrigin: "https://editor.test",
    provider,
    maxDurationMs: 20,
    maxInputBytes: 4096,
    maxOutputBytes: 4096,
    verifyCsrf() {
      return Promise.resolve(true)
    },
    authenticate() {
      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "better-auth", userId: "fixture" },
        credentialExpiresAt: Date.now() + 60000,
      })
    },
    policy() {
      return Promise.resolve(true)
    },
    reserve() {
      return Promise.resolve("reserved")
    },
  })

  const response = await handle(
    new Request("https://editor.test/ai", {
      method: "POST",
      headers: {
        origin: "https://editor.test",
        "content-type": "application/json",
        "x-editor-request": "1",
      },
      body: JSON.stringify({
        documentId: "doc-1",
        operation: "generate",
        instruction: "fixture",
      }),
    }),
  )

  const body = await response.text()
  assert.match(body, /deadline/)
  assert.doesNotMatch(body, /event: complete/)
  assert.equal(calls, 1)
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(cancelled, 1)
  console.info(JSON.stringify({ stage: "provider-" + stage, calls, cancelled }))
}

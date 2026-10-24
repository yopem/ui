import type { AiHandlerOptions } from "@editor/server/ai/contracts"

import { createEditorAiHandler } from "@editor/server/ai/http"
import {
  createOpenAiProvider,
  createAnthropicProvider,
  createWorkersAiProvider,
} from "@editor/server/ai/providers"
import { afterEach, expect, test } from "bun:test"

const servers: ReturnType<typeof Bun.serve>[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop(true)))
})

const encoder = new TextEncoder()

const chat =
  'data: {"choices":[{"index":0,"delta":{"content":"héllo"},"finish_reason":null}]}\r\n\r\ndata: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'

const anthropic =
  'event: message_start\ndata: {"type":"message_start"}\n\nevent: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta","index":0,\ndata: "delta":{"type":"text_delta","text":"héllo"}}\n\nevent: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\nevent: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\nevent: message_stop\ndata: {"type":"message_stop"}\n\n'

function fixture(wire = chat, status = 200) {
  const bodies: unknown[] = []
  const urls: string[] = []

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      bodies.push(await request.json())
      const bytes = encoder.encode(wire)
      let offset = 0

      return new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            if (offset === bytes.length) controller.close()
            else controller.enqueue(bytes.slice(offset, ++offset))
          },
        }),
        { status, headers: { "content-type": "text/event-stream" } },
      )
    },
  })

  servers.push(server)

  const transport = (request: Request) => {
    urls.push(request.url)
    expect(request.redirect).toBe("error")
    expect(new URL(request.url).hostname).toMatch(
      /^(api.openai.com|api.anthropic.com|api.cloudflare.com)$/,
    )

    return fetch(new Request(server.url, request))
  }

  return { bodies, urls, transport }
}

function options(provider: AiHandlerOptions["provider"]): AiHandlerOptions {
  return {
    provider,
    trustedOrigin: "https://editor.example",
    authenticate: () =>
      Promise.resolve({
        status: "authenticated",
        identity: { provider: "better-auth", userId: "admin" },
        credentialExpiresAt: Date.now() + 60_000,
      }),
    policy: () => Promise.resolve(true),
    verifyCsrf: () => Promise.resolve(true),
    reserve: () => Promise.resolve("reserved"),
    maxDurationMs: 1000,
    maxInputBytes: 4096,
    maxOutputBytes: 4096,
  }
}

function request(
  body: Record<string, string> = {
    documentId: "doc",
    operation: "generate",
    instruction: "Draft",
    selectedText: "",
    context: "",
  },
  headers?: Record<string, string>,
  signal?: AbortSignal,
) {
  return new Request("https://editor.example/ai", {
    method: "POST",
    headers: {
      origin: "https://editor.example",
      "content-type": "application/json",
      "x-editor-request": "1",
      ...headers,
    },
    body: JSON.stringify(body),
    signal,
  })
}

for (const kind of ["openai", "anthropic", "cloudflare"] as const) {
  test(`${kind}: real HTTP protocol fixture, UTF8 fragmentation, host config`, async () => {
    const f = fixture(kind === "anthropic" ? anthropic : chat)

    const common = {
      apiKey: "fixture-only",
      model: "host-model",
      system: "Host instructions",
      maxTokens: 64,
      transport: f.transport,
    }

    const provider =
      kind === "openai"
        ? createOpenAiProvider(common)
        : kind === "anthropic"
          ? createAnthropicProvider(common)
          : createWorkersAiProvider({
              ...common,
              accountId: "a".repeat(32),
              model: "@cf/vendor/model",
              schema: "chat-completions",
            })

    const handler = createEditorAiHandler(options(provider))
    const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: handler })
    servers.push(server)
    const response = await fetch(new Request(server.url, request()))
    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://editor.example",
    )
    const text = await response.text()
    expect(text).toContain("héllo")
    expect(text).toContain("event: complete")
    expect(text).not.toContain("event: error")
    expect(f.bodies).toHaveLength(1)
    expect(f.urls).toEqual([
      kind === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : kind === "anthropic"
          ? "https://api.anthropic.com/v1/messages"
          : `https://api.cloudflare.com/client/v4/accounts/${"a".repeat(32)}/ai/v1/chat/completions`,
    ])
    const body = f.bodies[0]
    expect(body).toMatchObject(
      kind === "anthropic"
        ? { max_tokens: 64, system: "Host instructions", stream: true }
        : {
            max_completion_tokens: 64,
            messages: [
              { role: "system", content: "Host instructions" },
              { role: "user", content: expect.any(String) },
            ],
            stream: true,
          },
    )
  })
}

test("security gates never invoke upstream", async () => {
  const f = fixture()

  const provider = createOpenAiProvider({
    apiKey: "fixture",
    model: "host",
    system: "host",
    maxTokens: 64,
    transport: f.transport,
  })

  const cases: [Partial<AiHandlerOptions>, Request, number][] = [
    [
      { authenticate: () => Promise.resolve({ status: "unauthenticated" }) },
      request(),
      401,
    ],
    [
      { authenticate: () => Promise.resolve({ status: "unavailable" }) },
      request(),
      503,
    ],
    [{ policy: () => Promise.resolve(false) }, request(), 403],
    [{ policy: () => Promise.resolve("unavailable") }, request(), 503],
    [
      {
        policy: () => Promise.reject(new Error("secret")),
      },
      request(),
      503,
    ],
    [{ verifyCsrf: () => Promise.resolve(false) }, request(), 403],
    [
      {
        verifyCsrf: () => Promise.reject(new Error("secret")),
      },
      request(),
      503,
    ],
    [{ reserve: () => Promise.resolve("denied") }, request(), 429],
    [{ reserve: () => Promise.resolve("unavailable") }, request(), 503],
    [{}, request(undefined, { origin: "https://evil.example" }), 403],
    [
      {},
      request({
        documentId: "doc",
        operation: "generate",
        instruction: "x",
        model: "client",
      }),
      400,
    ],
    [
      {},
      request({
        documentId: "doc",
        operation: "rewrite",
        instruction: "x",
        selectedText: "",
        context: "",
      }),
      400,
    ],
    [{ maxInputBytes: 64 }, request({ instruction: "x".repeat(1000) }), 413],
    [
      {
        authenticate: () =>
          Promise.resolve({
            status: "authenticated",
            identity: { provider: "openauth", userId: "x" },
            credentialExpiresAt: Date.now() - 1,
          }),
      },
      request(),
      401,
    ],
  ]

  for (const [changes, req, status] of cases) {
    const response = await createEditorAiHandler({
      ...options(provider),
      ...changes,
    })(req)

    expect(response.status).toBe(status)
    expect(await response.text()).not.toContain("secret")
  }

  expect(f.urls).toHaveLength(0)
})

for (const wire of [
  "data: nope\n\n",
  chat.replace('"stop"', '"length"'),
  chat.replace("data: [DONE]\n\n", ""),
  'data: {"error":{"message":"secret"}}\n\n',
]) {
  test("bad or truncated stream never completes or leaks", async () => {
    const f = fixture(wire)

    const provider = createOpenAiProvider({
      apiKey: "fixture",
      model: "host",
      system: "host",
      maxTokens: 64,
      transport: f.transport,
    })

    const response = await createEditorAiHandler(options(provider))(request())
    const text = await response.text()
    expect(text).toContain("event: error")
    expect(text).not.toContain("event: complete")
    expect(text).not.toContain("secret")
    expect(f.urls).toHaveLength(1)
  })
}

test("provider failure no retry; bounded output", async () => {
  for (const status of [429, 503, 302]) {
    const f = fixture("secret", status)

    const provider = createOpenAiProvider({
      apiKey: "fixture",
      model: "host",
      system: "host",
      maxTokens: 64,
      transport: f.transport,
    })

    const response = await createEditorAiHandler(options(provider))(request())
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain("secret")
    expect(f.urls).toHaveLength(1)
  }

  const f = fixture()

  const provider = createOpenAiProvider({
    apiKey: "fixture",
    model: "host",
    system: "host",
    maxTokens: 64,
    transport: f.transport,
  })

  const text = await (
    await createEditorAiHandler({ ...options(provider), maxOutputBytes: 1 })(
      request(),
    )
  ).text()

  expect(text).toContain("output_limit")
  expect(text).not.toContain("event: complete")
})

test("deadline, expiry and disconnect abort upstream", async () => {
  for (const mode of ["deadline", "expiry", "disconnect"] as const) {
    let aborted = false

    const transport = (req: Request) => {
      req.signal.addEventListener(
        "abort",
        () => {
          aborted = true
        },
        { once: true },
      )

      return Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'data: {"choices":[{"index":0,"delta":{"content":"x"},"finish_reason":null}]}\n\n',
                ),
              )
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        ),
      )
    }

    const provider = createOpenAiProvider({
      apiKey: "fixture",
      model: "host",
      system: "host",
      maxTokens: 64,
      transport,
    })

    const config = { ...options(provider), maxDurationMs: 50 }

    if (mode === "expiry")
      config.authenticate = () =>
        Promise.resolve({
          status: "authenticated",
          identity: { provider: "openauth", userId: "x" },
          credentialExpiresAt: Date.now() + 20,
        })
    const response = await createEditorAiHandler(config)(request())

    if (mode === "disconnect") await response.body?.cancel()
    else {
      const text = await response.text()
      expect(text).toContain(
        mode === "expiry" ? "credential_expired" : "deadline",
      )
      expect(text).not.toContain("event: complete")
    }

    expect(aborted).toBe(true)
  }
})

test("fail configuration before traffic", () => {
  expect(() =>
    createOpenAiProvider({
      apiKey: "",
      model: "host",
      system: "host",
      maxTokens: 64,
    }),
  ).toThrow()
  expect(() =>
    createWorkersAiProvider({
      apiKey: "fixture",
      model: "https://evil",
      system: "host",
      maxTokens: 64,
      accountId: "bad",
      schema: "chat-completions",
    }),
  ).toThrow()
})

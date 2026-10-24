import type { AiHandlerOptions } from "@editor/server/ai/contracts"

import { createEditorAiHandler } from "@editor/server/ai/http"
import {
  createAnthropicProvider,
  createOpenAiProvider,
} from "@editor/server/ai/providers"
import { expect, test } from "bun:test"

const encoder = new TextEncoder()

function setup(wire: string) {
  let reads = 0
  let cancelled = false
  let calls = 0

  const provider = createOpenAiProvider({
    apiKey: "fixture",
    model: "host",
    system: "host",
    maxTokens: 8,
    transport(request) {
      calls++
      request.signal.addEventListener("abort", () => {
        cancelled = true
      })

      return Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>(
            {
              pull(controller) {
                reads++
                controller.enqueue(encoder.encode(wire))
              },
              cancel() {
                cancelled = true
              },
            },
            { highWaterMark: 0 },
          ),
          { headers: { "content-type": "text/event-stream" } },
        ),
      )
    },
  })

  const options: AiHandlerOptions = {
    provider,
    trustedOrigin: "https://editor.example",
    authenticate: () =>
      Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "member" },
        credentialExpiresAt: Date.now() + 60_000,
      }),
    policy: () => Promise.resolve(true),
    verifyCsrf: () => Promise.resolve(true),
    reserve: () => Promise.resolve("reserved"),
    maxDurationMs: 200,
    maxInputBytes: 1024,
    maxOutputBytes: 1024,
  }

  function req(
    body: string = JSON.stringify({
      documentId: "doc",
      operation: "copilot",
      instruction: "continue",
      context: "before cursor",
    }),
    signal?: AbortSignal,
  ) {
    return new Request("https://editor.example/ai", {
      method: "POST",
      headers: {
        origin: "https://editor.example",
        "content-type": "application/json",
        "x-editor-request": "1",
      },
      body,
      signal,
    })
  }

  return { options, req, state: () => ({ reads, cancelled, calls }) }
}

test("backpressure, consumer cancel, request disconnect", async () => {
  for (const mode of ["consumer", "request"] as const) {
    const f = setup(
      'data: {"choices":[{"index":0,"delta":{"content":"x"},"finish_reason":null}]}\n\n',
    )

    const abort = new AbortController()

    const response = await createEditorAiHandler(f.options)(
      f.req(undefined, abort.signal),
    )

    expect(f.state().reads).toBe(0)
    const reader = response.body?.getReader()
    expect((await reader?.read())?.done).toBe(false)
    const reads = f.state().reads
    await Bun.sleep(10)
    expect(f.state().reads).toBe(reads)

    if (mode === "consumer") await reader?.cancel()
    else {
      abort.abort()
      expect(new TextDecoder().decode((await reader?.read())?.value)).toContain(
        "cancelled",
      )
    }

    expect(f.state().cancelled).toBe(true)
    expect(f.state().calls).toBe(1)
  }
})

test("deadlines include dependency checks; quota cannot extend credential expiry", async () => {
  const f = setup(": ping\n\n")

  const response = await createEditorAiHandler({
    ...f.options,
    maxDurationMs: 10,
    policy: () => new Promise(() => undefined),
  })(f.req())

  expect(response.status).toBe(503)
  expect(f.state().calls).toBe(0)

  const expired = await createEditorAiHandler({
    ...f.options,
    authenticate: () =>
      Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "member" },
        credentialExpiresAt: Date.now() + 10,
      }),
    async reserve() {
      await Bun.sleep(30)

      return "reserved"
    },
  })(f.req())

  expect(expired.status).toBe(503)
  await Bun.sleep(35)
  expect(f.state().calls).toBe(0)
})

test("oversized frames and missing terminal fail closed", async () => {
  for (const wire of [
    "data: " + "x".repeat(65_537),
    "data: [DONE]\n\n",
    'data: {"choices":[]}\n\n',
  ]) {
    const f = setup(wire)
    const response = await createEditorAiHandler(f.options)(f.req())
    const output = await response.text()
    expect(output).toContain("event: error")
    expect(output).not.toContain("event: complete")
    expect(f.state().cancelled).toBe(true)
  }
})

test("Anthropic errors, token limits, unsupported deltas and EOF never complete", async () => {
  for (const wire of [
    'event: error\ndata: {"type":"error","error":{"message":"secret"}}\n\n',
    'data: {"type":"message_start"}\n\ndata: {"type":"message_delta","delta":{"stop_reason":"max_tokens"}}\n\n',
    'data: {"type":"message_start"}\n\ndata: {"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"secret"}}\n\n',
    'data: {"type":"message_start"}\n\n',
  ]) {
    const f = setup("")

    const provider = createAnthropicProvider({
      apiKey: "fixture",
      model: "host",
      system: "host",
      maxTokens: 8,
      transport: () =>
        Promise.resolve(
          new Response(wire, {
            headers: { "content-type": "text/event-stream" },
          }),
        ),
    })

    const response = await createEditorAiHandler({ ...f.options, provider })(
      f.req(),
    )

    const output = await response.text()
    expect(output).toContain("event: error")
    expect(output).not.toContain("event: complete")
    expect(output).not.toContain("secret")
  }
})

test("preflight, wrong method/type, malformed input and constructor guards", async () => {
  const f = setup("")
  const handler = createEditorAiHandler(f.options)

  const preflight = await handler(
    new Request("https://editor.example/ai", {
      method: "OPTIONS",
      headers: {
        origin: "https://editor.example",
        "access-control-request-method": "POST",
        "access-control-request-headers": "x-csrf-token, content-type",
      },
    }),
  )

  expect(preflight.status).toBe(204)
  expect(preflight.headers.get("access-control-allow-origin")).not.toBe("*")
  expect((await handler(new Request(f.req(), { method: "PUT" }))).status).toBe(
    405,
  )
  expect(
    (
      await handler(
        new Request(f.req(), {
          headers: {
            origin: "https://editor.example",
            "x-editor-request": "1",
            "content-type": "text/plain",
          },
        }),
      )
    ).status,
  ).toBe(415)
  expect((await handler(f.req("{"))).status).toBe(400)
  expect(f.state().calls).toBe(0)
  expect(() =>
    createEditorAiHandler({
      ...f.options,
      trustedOrigin: "https://editor.example/",
    }),
  ).toThrow()
  expect(() =>
    createEditorAiHandler({ ...f.options, maxDurationMs: Infinity }),
  ).toThrow()
})

test("invalid upstream UTF8 and unsupported Anthropic block fail closed", async () => {
  const f = setup("")

  const invalid = createOpenAiProvider({
    apiKey: "fixture",
    model: "host",
    system: "host",
    maxTokens: 8,
    transport: () =>
      Promise.resolve(
        new Response(new Uint8Array([100, 97, 116, 97, 58, 32, 255, 10, 10]), {
          headers: { "content-type": "text/event-stream" },
        }),
      ),
  })

  const tool = createAnthropicProvider({
    apiKey: "fixture",
    model: "host",
    system: "host",
    maxTokens: 8,
    transport: () =>
      Promise.resolve(
        new Response(
          'data: {"type":"message_start"}\n\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use"}}\n\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\ndata: {"type":"message_stop"}\n\n',
          { headers: { "content-type": "text/event-stream" } },
        ),
      ),
  })

  for (const provider of [invalid, tool]) {
    const output = await (
      await createEditorAiHandler({ ...f.options, provider })(f.req())
    ).text()

    expect(output).toContain("event: error")
    expect(output).not.toContain("event: complete")
  }
})

for (const expiry of [
  undefined,
  Date.now() - 1,
  Number.NaN,
  Number.POSITIVE_INFINITY,
]) {
  test(`AI invocation requires verified finite future expiry: ${String(expiry)}`, async () => {
    const fixture = setup(": ping\n\n")

    const response = await createEditorAiHandler({
      ...fixture.options,
      authenticate: () =>
        Promise.resolve({
          status: "authenticated",
          identity: { provider: "openauth", userId: "member" },
          credentialExpiresAt: expiry,
        }),
    })(fixture.req())

    expect(response.status).toBe(401)
    expect(fixture.state().calls).toBe(0)
  })
}

import type { AiHandlerOptions } from "@editor/server/ai/contracts"

import { createEditorAiHandler } from "@editor/server/ai/http"
import { createOpenAiProvider } from "@editor/server/ai/providers"
import { readSse } from "@editor/server/ai/streams"
import { expect, test } from "bun:test"

async function rejection<T extends Promise<unknown>>(work: T) {
  try {
    await work
  } catch (error) {
    if (error instanceof Error) return error

    throw new Error("non-Error rejection")
  }

  throw new Error("expected rejection")
}

for (const stage of ["csrf", "authenticate", "policy"] as const) {
  for (const mode of ["deadline", "disconnect"] as const) {
    test(`${stage} observes shared ${mode} cancellation`, async () => {
      let calls = 0
      let callbackRequest: Request | undefined
      let settled = false
      const incoming = new AbortController()
      const started = Promise.withResolvers<void>()

      function wait(request: Request) {
        callbackRequest = request
        expect(request.url).toBe("https://editor.example/ai")
        expect(request.headers.get("authorization")).toBe("Bearer fixture")
        expect(request.headers.get("cookie")).toBe("session=fixture")
        expect(request.credentials).toBe("include")
        started.resolve()

        return new Promise<never>((_resolve, reject) => {
          request.signal.addEventListener(
            "abort",
            () => {
              settled = true
              reject(new Error("callback cancelled"))
            },
            { once: true },
          )
        })
      }

      const options: AiHandlerOptions = {
        trustedOrigin: "https://editor.example",
        provider: createOpenAiProvider({
          apiKey: "fixture",
          model: "host",
          system: "host",
          maxTokens: 8,
          transport() {
            calls++

            return Promise.reject(new Error("unexpected provider"))
          },
        }),
        verifyCsrf: stage === "csrf" ? wait : () => Promise.resolve(true),
        authenticate:
          stage === "authenticate"
            ? wait
            : () =>
                Promise.resolve({
                  status: "authenticated",
                  identity: { provider: "openauth", userId: "member" },
                  credentialExpiresAt: Date.now() + 60_000,
                }),
        policy:
          stage === "policy"
            ? ({ request }) => wait(request)
            : () => Promise.resolve(true),
        reserve() {
          calls++

          return Promise.resolve("reserved")
        },
        maxDurationMs: mode === "deadline" ? 30 : 1000,
        maxInputBytes: 1024,
        maxOutputBytes: 1024,
      }

      const request = new Request("https://editor.example/ai", {
        method: "POST",
        credentials: "include",
        signal: incoming.signal,
        headers: {
          origin: "https://editor.example",
          "content-type": "application/json",
          "x-editor-request": "1",
          authorization: "Bearer fixture",
          cookie: "session=fixture",
        },
        body: JSON.stringify({
          documentId: "doc",
          operation: "generate",
          instruction: "Draft",
        }),
      })

      try {
        const pending = createEditorAiHandler(options)(request)
        await started.promise

        if (mode === "disconnect") incoming.abort()
        const response = await pending
        expect(response.status).toBe(503)
        expect(await response.json()).toEqual({
          code: mode === "deadline" ? "deadline" : "cancelled",
        })
        expect(calls).toBe(0)
        expect(callbackRequest?.signal.aborted).toBe(true)
        expect(settled).toBe(true)
        expect(request.signal.aborted).toBe(mode === "disconnect")
      } finally {
        incoming.abort()
      }
    })
  }
}

const encoder = new TextEncoder()

async function frames(wire: Uint8Array, fragments: boolean) {
  let offset = 0
  let cancelled = false
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset === wire.length) {
        closed = true
        controller.close()
      } else {
        const end = Math.min(
          wire.length,
          offset + (fragments ? 1 : wire.length),
        )

        controller.enqueue(wire.slice(offset, end))
        offset = end
      }
    },
    cancel() {
      cancelled = true
    },
  })

  const output: { event: string; data: string }[] = []

  try {
    for await (const frame of readSse(stream, new AbortController().signal))
      output.push(frame)

    return output
  } finally {
    expect(stream.locked).toBe(false)
    expect(cancelled || closed).toBe(true)
  }
}

test("180008-byte non-ASCII frame fails before dispatch", async () => {
  const wire = encoder.encode(`data: ${"€".repeat(60000)}\n\n`)
  expect(wire.byteLength).toBe(180008)
  expect(await rejection(frames(wire, false))).toMatchObject({
    code: "invalid_stream",
  })
})

for (const delimiter of ["\n", "\r\n", "\r"]) {
  for (const fragments of [false, true]) {
    test(`UTF8 frame byte boundary ${JSON.stringify(delimiter)} fragmented=${fragments}`, async () => {
      const overhead = encoder.encode(
        `data: ${delimiter}${delimiter}`,
      ).byteLength

      const payloadBytes = 65536 - overhead

      const payload =
        "€".repeat(Math.floor(payloadBytes / 3)) + "x".repeat(payloadBytes % 3)

      const wire = encoder.encode(`data: ${payload}${delimiter}${delimiter}`)
      expect(wire.byteLength).toBe(65536)
      expect(await frames(wire, fragments)).toEqual([
        { event: "", data: payload },
      ])
      expect(
        await rejection(
          frames(
            encoder.encode(`data: ${payload}x${delimiter}${delimiter}`),
            fragments,
          ),
        ),
      ).toMatchObject({ code: "invalid_stream" })
    })
  }
}

test("frame budgets reset; fragmented astral UTF8, CRLF and BOM remain valid", async () => {
  expect(
    await frames(encoder.encode("\uFEFFdata: 😀\r\n\r\ndata: €\r\n\r\n"), true),
  ).toEqual([
    { event: "", data: "😀" },
    { event: "", data: "€" },
  ])
  const payload = "x".repeat(65528)
  expect(
    await frames(
      encoder.encode(`data: ${payload}\n\ndata: ${payload}\n\n`),
      false,
    ),
  ).toHaveLength(2)
})

test("invalid and truncated UTF8 still fail closed", async () => {
  for (const bytes of [[255], [0xe2, 0x82]]) {
    expect(await rejection(frames(new Uint8Array(bytes), true))).toBeInstanceOf(
      TypeError,
    )
  }
})

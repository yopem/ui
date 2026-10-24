import { requestEditorAi } from "@editor/ai-client"
import { createEditorAiHandler } from "@editor/server/ai/http"
import { createOpenAiProvider } from "@editor/server/ai/providers"
import assert from "node:assert/strict"
import { once } from "node:events"
import { readFile } from "node:fs/promises"
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http"
import { createServer, request as httpsRequest } from "node:https"
import { z } from "zod"

const keyPath = process.env.EDITOR_AI_FIXTURE_KEY

const certPath = process.env.EDITOR_AI_FIXTURE_CERT

if (!keyPath || !certPath)
  throw new Error("Fixture TLS key and certificate required")

const key = await readFile(keyPath)

const cert = await readFile(certPath)

let providerCalls = 0

let providerCancelled = 0

let callbackAborted = 0

async function serveProvider(
  incoming: IncomingMessage,
  outgoing: ServerResponse,
) {
  providerCalls++
  const chunks: Buffer[] = []

  for await (const chunk of incoming) chunks.push(Buffer.from(chunk))
  const input: unknown = JSON.parse(Buffer.concat(chunks).toString())
  z.object({
    model: z.literal("host-fixture"),
    stream: z.literal(true),
    n: z.literal(1),
    max_completion_tokens: z.number().int().positive(),
  }).parse(input)
  assert.equal(incoming.headers.authorization, "Bearer fixture-only")
  outgoing.writeHead(200, { "content-type": "text/event-stream" })
  outgoing.write(
    'data: {"choices":[{"index":0,"delta":{"content":"<script>proposal</script>"},"finish_reason":null}]}\n\n',
  )

  const timer = setTimeout(() => {
    outgoing.end(
      'data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    )
  }, 200)

  outgoing.on("close", () => {
    clearTimeout(timer)

    if (!outgoing.writableEnded) providerCancelled++
  })
}

const upstream = createHttpServer((incoming, outgoing) => {
  void serveProvider(incoming, outgoing).catch(() => outgoing.destroy())
})

upstream.listen(0, "127.0.0.1")

await once(upstream, "listening")

const upstreamAddress = z
  .object({ port: z.number().int().positive() })
  .parse(upstream.address())

const upstreamUrl = `http://127.0.0.1:${upstreamAddress.port}`

let origin = ""

async function serveHandler(
  incoming: IncomingMessage,
  outgoing: ServerResponse,
) {
  const controller = new AbortController()
  outgoing.on("close", () => {
    if (!outgoing.writableEnded) controller.abort()
  })
  incoming.on("aborted", () => controller.abort())

  try {
    if (incoming.url === "/__fixture-evidence") {
      outgoing.setHeader("content-type", "application/json")
      outgoing.end(
        JSON.stringify({
          providerCalls,
          providerCancelled,
          callbackAborted,
          evidence: "Synthetic native HTTP protocol fixture; no inference",
        }),
      )

      return
    }

    if (incoming.url !== "/__fixture-ai") {
      const docsOrigin = process.env.EDITOR_AI_FIXTURE_DOCS_ORIGIN

      if (!docsOrigin) {
        outgoing.writeHead(404).end()

        return
      }

      const target = new URL(incoming.url ?? "/", docsOrigin)

      if (target.origin !== new URL(docsOrigin).origin) {
        outgoing.writeHead(400).end()

        return
      }

      const proxy = await fetch(target, { redirect: "error" })
      const proxyHeaders = new Headers(proxy.headers)
      proxyHeaders.delete("content-encoding")
      proxyHeaders.delete("content-length")
      outgoing.writeHead(proxy.status, Object.fromEntries(proxyHeaders))

      if (proxy.body) {
        for await (const chunk of proxy.body) outgoing.write(chunk)
      }

      outgoing.end()

      return
    }

    const body = new ReadableStream<Uint8Array>({
      start(stream) {
        incoming.on("data", (chunk: Buffer) =>
          stream.enqueue(new Uint8Array(chunk)),
        )
        incoming.on("end", () => stream.close())
        incoming.on("error", (error) => stream.error(error))
      },
      cancel() {
        incoming.destroy()
      },
    })

    const headers = new Headers()

    for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
      const name = incoming.rawHeaders[index]
      const value = incoming.rawHeaders[index + 1]

      if (name !== undefined && value !== undefined) headers.append(name, value)
    }

    const init: RequestInit & { duplex: "half" } = {
      method: incoming.method,
      headers,
      body,
      duplex: "half",
      signal: controller.signal,
    }

    const response = await handler(new Request(`${origin}/__fixture-ai`, init))
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))

    if (response.body) {
      for await (const chunk of response.body) {
        if (!outgoing.write(chunk))
          await once(outgoing, "drain", { signal: controller.signal })
      }
    }

    outgoing.end()
  } catch {
    outgoing.destroy()
  }
}

const server = createServer({ key, cert }, (incoming, outgoing) => {
  void serveHandler(incoming, outgoing).catch(() => outgoing.destroy())
})

server.listen(0, "127.0.0.1")

await once(server, "listening")

const address = z
  .object({ port: z.number().int().positive() })
  .parse(server.address())

origin = `https://127.0.0.1:${address.port}`

const handler = createEditorAiHandler({
  trustedOrigin: origin,
  provider: createOpenAiProvider({
    apiKey: "fixture-only",
    model: "host-fixture",
    system: "Protocol fixture, not inference",
    maxTokens: 16,
    transport(request) {
      return fetch(new Request(upstreamUrl, request))
    },
  }),
  verifyCsrf(request) {
    request.signal.addEventListener("abort", () => callbackAborted++, {
      once: true,
    })

    return Promise.resolve(
      request.headers.get("x-csrf-token") === "fixture-only",
    )
  },
  authenticate: (request) =>
    Promise.resolve(
      request.headers.get("x-csrf-token") === "fixture-only"
        ? {
            status: "authenticated",
            identity: { provider: "openauth", userId: "fixture-user" },
            credentialExpiresAt: Date.now() + 5000,
          }
        : { status: "unauthenticated" },
    ),
  policy: ({ action, documentId }) =>
    Promise.resolve(action === "ai:invoke" && documentId === "fixture-doc"),
  reserve: () => Promise.resolve("reserved"),
  maxDurationMs: 2000,
  maxInputBytes: 131072,
  maxOutputBytes: 1048576,
})

function invoke(cancel: boolean, csrf = "fixture-only") {
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    const call = httpsRequest(
      `${origin}/__fixture-ai`,
      {
        method: "POST",
        ca: cert,
        headers: {
          origin,
          "content-type": "application/json",
          "x-editor-request": "1",
          "x-csrf-token": csrf,
        },
      },
      (response) => {
        let text = ""
        response.on("data", (chunk: Buffer) => {
          text += chunk.toString()

          if (cancel) {
            response.destroy()
            resolve({ status: response.statusCode ?? 0, text })
          }
        })
        response.on("end", () =>
          resolve({ status: response.statusCode ?? 0, text }),
        )
        response.on("error", reject)
      },
    )

    call.on("error", reject)
    call.end(
      JSON.stringify({
        documentId: "fixture-doc",
        operation: "generate",
        instruction: "Draft",
      }),
    )
  })
}

if (process.env.EDITOR_AI_FIXTURE_SERVE === "1") {
  console.info(
    JSON.stringify({
      origin,
      endpoint: "/__fixture-ai",
      documentId: "fixture-doc",
      csrf: "fixture-only",
      evidence: "Native HTTP protocol fixture; no inference; loopback only",
    }),
  )
} else {
  try {
    for (const mode of ["deadline", "disconnect"] as const) {
      let cancelled = false
      const abort = new AbortController()
      const started = Promise.withResolvers<void>()
      let callbackRequest: Request | undefined

      const source = new ReadableStream<Uint8Array>({
        cancel() {
          cancelled = true
        },
      })

      const init: RequestInit & { duplex: "half" } = {
        method: "POST",
        body: source,
        duplex: "half",
        signal: abort.signal,
        headers: {
          origin,
          "content-type": "application/json",
          "x-editor-request": "1",
        },
      }

      const request = new Request(`${origin}/__fixture-ai`, init)

      const bodyHandler = createEditorAiHandler({
        trustedOrigin: origin,
        provider: createOpenAiProvider({
          apiKey: "fixture-only",
          model: "host-fixture",
          system: "fixture",
          maxTokens: 8,
        }),
        verifyCsrf: (linked) => {
          callbackRequest = linked
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

      const pending = bodyHandler(request)
      await started.promise

      if (mode === "disconnect") abort.abort()
      const response = await pending
      assert.equal(response.status, 503)
      assert.equal(callbackRequest?.body, request.body)
      assert.equal(callbackRequest?.signal.aborted, true)
      assert.equal(cancelled, true)
      assert.equal(request.body?.locked, false)
    }

    const denied = await invoke(false, "invalid")
    assert.equal(denied.status, 403)
    assert.equal(providerCalls, 0)
    const completed = await invoke(false)
    assert.equal(completed.status, 200)
    assert.match(completed.text, /event: text/)
    assert.match(completed.text, /event: complete/)
    assert.match(completed.text, /<script>proposal<\/script>/)
    const progress: string[] = []

    const proposal = await requestEditorAi(
      {
        endpoint: "/__fixture-ai",
        documentId: "fixture-doc",
        headers: () =>
          Promise.resolve({ origin, "x-csrf-token": "fixture-only" }),
      },
      {
        operation: "generate",
        instruction: "Draft",
        selectedText: "",
        context: "",
      },
      origin,
      new AbortController().signal,
      (text) => progress.push(text),
    )

    assert.equal(proposal, "<script>proposal</script>")
    assert.ok(progress.length > 0)
    await assert.rejects(
      requestEditorAi(
        {
          endpoint: "/__fixture-ai",
          documentId: "fixture-doc",
          timeoutMs: 10,
          headers: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50))

            return { origin, "x-csrf-token": "fixture-only" }
          },
        },
        {
          operation: "generate",
          instruction: "Draft",
          selectedText: "",
          context: "",
        },
        origin,
        new AbortController().signal,
        () => undefined,
      ),
      /deadline/,
    )
    const cancelled = await invoke(true)
    assert.equal(cancelled.status, 200)
    await new Promise((resolve) => setTimeout(resolve, 300))
    assert.equal(providerCalls, 3)
    assert.equal(providerCancelled, 1)
    assert.ok(callbackAborted >= 2)
    console.info(
      JSON.stringify({
        runtime: process.versions,
        completed: true,
        denied: denied.status,
        providerCalls,
        providerCancelled,
        callbackAborted,
        evidence:
          "Owned HTTPS handler and native HTTP provider fixture; no inference",
      }),
    )
  } finally {
    server.closeAllConnections()
    upstream.closeAllConnections()
    server.close()
    upstream.close()
  }
}

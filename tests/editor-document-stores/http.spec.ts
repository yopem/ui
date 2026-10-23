import { createDocumentHttpHandler } from "@editor/server/document-http"
import { DocumentError } from "@editor/server/document-model"
import { expect, test } from "bun:test"

function options() {
  return {
    origin: "https://editor.example",
    basePath: "/documents/",
    authenticate: function authenticate() {
      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "user" },
      } as const)
    },
    policy: function policy() {
      return true
    },
    verifyCsrf: function verifyCsrf() {
      return true
    },
    service: {
      read: function read() {
        return Promise.resolve(null)
      },
      mutate: function mutate(): Promise<never> {
        return Promise.reject(new DocumentError("uncertain"))
      },
    },
    timeoutMs: 100,
    maxConcurrent: 1,
  }
}

function request(
  body = JSON.stringify({
    schemaVersion: 1,
    state: { root: { type: "root", children: [] } },
  }),
) {
  return new Request("https://editor.example/documents/app:test", {
    method: "PUT",
    headers: {
      origin: "https://editor.example",
      "x-csrf-token": "token",
      "content-type": "application/json",
      "if-none-match": "*",
      "idempotency-key": crypto.randomUUID(),
    },
    body,
  })
}

test("safe uncertainty and upstream error bodies", async function errors() {
  const handler = createDocumentHttpHandler(options())
  const response = await handler(request())
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({
    error: "uncertain",
    retry: "same-operation",
  })

  const failed = createDocumentHttpHandler({
    ...options(),
    authenticate: function authenticate(): Promise<never> {
      throw new Error("secret SQL credentials")
    },
  })

  const failure = await failed(request())
  expect(failure.status).toBe(503)
  expect(await failure.text()).not.toContain("secret")
})

test("expired after host policy and unauthenticated requests never dispatch", async function expiry() {
  const unauthenticated = createDocumentHttpHandler({
    ...options(),
    authenticate: function authenticate() {
      return Promise.resolve({ status: "unauthenticated" } as const)
    },
  })

  expect((await unauthenticated(request())).status).toBe(401)

  const expired = createDocumentHttpHandler({
    ...options(),
    authenticate: function authenticate() {
      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "user" },
        credentialExpiresAt: Date.now() + 20,
      } as const)
    },
    policy: async function policy() {
      await Bun.sleep(30)

      return true
    },
  })

  expect((await expired(request())).status).toBe(401)
})

test("deadline retains pending authentication slot", async function deadline() {
  const pending =
    Promise.withResolvers<
      Awaited<ReturnType<ReturnType<typeof options>["authenticate"]>>
    >()

  const handler = createDocumentHttpHandler({
    ...options(),
    timeoutMs: 10,
    authenticate: function authenticate() {
      return pending.promise
    },
  })

  expect((await handler(request())).status).toBe(503)
  expect((await handler(request())).status).toBe(503)
  pending.resolve(await options().authenticate())
})

test("strict envelopes and preconditions fail before mutation", async function malformed() {
  const handler = createDocumentHttpHandler(options())

  for (const body of [
    "{",
    "null",
    '{"schemaVersion":1,"state":{},"extra":true}',
    '{"schemaVersion":0,"state":{}}',
  ]) {
    expect((await handler(request(body))).status).toBe(400)
  }

  const duplicate = request()
  duplicate.headers.set("if-match", '"' + "a".repeat(64) + ':1"')
  expect((await handler(duplicate)).status).toBe(400)
  const operation = request()
  operation.headers.set("idempotency-key", "bad")
  expect((await handler(operation)).status).toBe(400)
  const missing = request()
  missing.headers.delete("origin")
  expect((await handler(missing)).status).toBe(403)
  const csrf = request()
  csrf.headers.delete("x-csrf-token")
  expect((await handler(csrf)).status).toBe(403)

  const invalidUtf8 = new Request(request(), {
    method: "PUT",
    body: new Uint8Array([255]),
  })

  expect((await handler(invalidUtf8)).status).toBe(400)

  const emptyChunk = new Request(request(), {
    method: "PUT",
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(0))
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({
              schemaVersion: 1,
              state: { root: { type: "root", children: [] } },
            }),
          ),
        )
        controller.close()
      },
    }),
  })

  expect(await (await handler(emptyChunk)).json()).toEqual({
    error: "uncertain",
    retry: "same-operation",
  })

  const endless = new Request(request(), {
    method: "PUT",
    body: new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(0))
      },
    }),
  })

  const bounded = createDocumentHttpHandler({ ...options(), timeoutMs: 10 })

  expect(await (await bounded(endless)).json()).toEqual({
    error: "unavailable",
  })

  let cancelled = false
  const cancellation = Promise.withResolvers<void>()

  const excessiveStream = new Request(request(), {
    method: "PUT",
    body: new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(524288))
      },
      cancel() {
        cancelled = true
        cancellation.resolve()
      },
    }),
  })

  expect((await handler(excessiveStream)).status).toBe(413)
  await cancellation.promise
  expect(cancelled).toBe(true)
})

for (const phase of ["authenticate", "policy", "csrf"] as const) {
  test(`HTTP ${phase} callback observes deadline through preserved Request`, async function callbackDeadline() {
    let observed: Request | undefined

    const incoming = new Request(request(), {
      method: "PUT",
      headers: {
        ...Object.fromEntries(request().headers),
        authorization: "Bearer fixture",
        cookie: "session=fixture",
      },
      credentials: "include",
    })

    async function wait(input: Request) {
      observed = input
      await new Promise<void>((resolve) => {
        if (input.signal.aborted) resolve()
        else
          input.signal.addEventListener("abort", () => resolve(), {
            once: true,
          })
      })
    }

    const base = options()

    const handler = createDocumentHttpHandler({
      ...base,
      timeoutMs: 20,
      authenticate: async function authenticate(input) {
        if (phase === "authenticate") await wait(input)

        return base.authenticate()
      },
      policy: async function policy(input) {
        if (phase === "policy") await wait(input.request)

        return true
      },
      verifyCsrf: async function verifyCsrf(input) {
        if (phase === "csrf") await wait(input.request)

        return true
      },
    })

    expect((await handler(incoming)).status).toBe(503)

    if (!observed) throw new Error("callback not observed")
    expect(observed.signal.aborted).toBe(true)
    expect(incoming.signal.aborted).toBe(false)
    expect(observed.url).toBe(incoming.url)
    expect(observed.credentials).toBe("include")
    expect(observed.headers.get("authorization")).toBe("Bearer fixture")
    expect(observed.headers.get("cookie")).toBe("session=fixture")
  })
}

function blockHttp() {
  const until = Date.now() + 70

  while (Date.now() < until) Math.sqrt(Date.now())
}

for (const phase of ["authenticate", "policy", "csrf"] as const) {
  test(`blocked HTTP ${phase} cannot start later work`, async function blockedCallback() {
    let policies = 0
    let csrf = 0
    let storage = 0
    let observed: Request | undefined
    const base = options()

    const handler = createDocumentHttpHandler({
      ...base,
      timeoutMs: 20,
      authenticate: function authenticate(input) {
        observed = input

        if (phase === "authenticate") blockHttp()

        return base.authenticate()
      },
      policy: function policy() {
        policies++

        if (phase === "policy") blockHttp()

        return true
      },
      verifyCsrf: function verifyCsrf() {
        csrf++

        if (phase === "csrf") blockHttp()

        return true
      },
      service: {
        read: function read() {
          storage++

          return Promise.resolve(null)
        },
        mutate: function mutate() {
          storage++

          return Promise.resolve({ status: "conflict" } as const)
        },
      },
    })

    expect((await handler(request())).status).toBe(503)
    expect(policies).toBe(phase === "authenticate" ? 0 : 1)
    expect(csrf).toBe(phase === "csrf" ? 1 : 0)
    expect(storage).toBe(0)
    expect(observed?.signal.aborted).toBe(true)
  })
}

for (const phase of ["read", "mutate"] as const) {
  test(`late HTTP ${phase} cannot return success`, async function lateResult() {
    const handler = createDocumentHttpHandler({
      ...options(),
      timeoutMs: 20,
      service: {
        read: function read() {
          blockHttp()

          return Promise.resolve(null)
        },
        mutate: function mutate() {
          blockHttp()

          return Promise.resolve({ status: "conflict" } as const)
        },
      },
    })

    const input =
      phase === "read"
        ? new Request("https://editor.example/documents/app:test")
        : request()

    const result = await handler(input)
    expect(result.status).toBe(503)
    expect(await result.json()).toEqual(
      phase === "read"
        ? { error: "unavailable" }
        : { error: "uncertain", retry: "same-operation" },
    )
  })
}

import type { AssetConfig } from "@editor/server/asset-model"

import { createAssetHttpHandler } from "@editor/server/asset-http"
import { expect, test } from "bun:test"

function fixture() {
  let dispatches = 0

  const config: AssetConfig = {
    repository: {
      head() {
        dispatches++

        return Promise.reject(new Error("Unexpected dispatch"))
      },
      reserve() {
        dispatches++

        return Promise.reject(new Error("Unexpected dispatch"))
      },
      read() {
        dispatches++

        return Promise.reject(new Error("Unexpected dispatch"))
      },
      promote() {
        dispatches++

        return Promise.reject(new Error("Unexpected dispatch"))
      },
      terminal() {
        dispatches++

        return Promise.resolve()
      },
      remove() {
        dispatches++

        return Promise.resolve(false)
      },
      claim() {
        dispatches++

        return Promise.resolve([])
      },
      ack() {
        dispatches++

        return Promise.resolve(false)
      },
      key() {
        dispatches++

        return Promise.reject(new Error("Unexpected dispatch"))
      },
    },
    objects: {
      put() {
        dispatches++

        return Promise.resolve()
      },
      get() {
        dispatches++

        return Promise.reject(new Error("Unexpected dispatch"))
      },
      delete() {
        dispatches++

        return Promise.resolve()
      },
      list() {
        dispatches++

        return Promise.resolve({ keys: [] })
      },
    },
    authenticate() {
      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "better-auth", userId: "user" },
        credentialExpiresAt: Date.now() + 10000,
      })
    },
    policy() {
      return Promise.resolve(true)
    },
    verifyCsrf() {
      return Promise.resolve(true)
    },
    validateImage() {
      return Promise.resolve(true)
    },
    allowedOrigins: ["https://app.example"],
    maxConcurrent: 1,
    timeoutMs: 20,
    maxFileBytes: 1024,
    maxTotalBytes: 1024,
    maxAttempts: 10,
    maxPending: 1,
    cleanupIntervalMs: 1000,
  }

  return { config, dispatches: () => dispatches }
}

function request(body?: ReadableStream<Uint8Array>) {
  const init = {
    method: "POST",
    headers: {
      Origin: "https://app.example",
      "X-Editor-Request": "1",
      "Content-Type": "image/png",
    },
    body,
    duplex: "half" as const,
  }

  return new Request(
    "https://app.example/editor/documents/doc:one/assets",
    init,
  )
}

test("queued operation cannot start callbacks after wall-clock deadline", async () => {
  const state = fixture()
  let authentications = 0
  const authenticate = state.config.authenticate
  state.config.authenticate = function authentication(input) {
    authentications++

    return authenticate(input)
  }

  const pending = createAssetHttpHandler(state.config).handle(request())
  const end = Date.now() + 40

  while (Date.now() < end) {
    Math.sqrt(Date.now())
  }

  const response = await pending
  expect(response.status).toBe(503)
  expect(authentications).toBe(0)
  expect(state.dispatches()).toBe(0)
})

for (const callback of ["authenticate", "verifyCsrf"] as const) {
  test(`${callback} receives deadline cancellation and source body cancellation`, async () => {
    const state = fixture()
    let cancelled = false
    let observed = false

    const source = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true
      },
    })

    const incoming = request(source)

    async function wait(input: Request) {
      await new Promise<void>((resolve) => {
        input.signal.addEventListener(
          "abort",
          () => {
            observed = true
            resolve()
          },
          { once: true },
        )
        setTimeout(resolve, 80)
      })
      await input.body?.cancel()
    }

    if (callback === "authenticate")
      state.config.authenticate = async function authenticate(input) {
        await wait(input)

        return { status: "unauthenticated" }
      }
    else
      state.config.verifyCsrf = async function verifyCsrf(input) {
        await wait(input)

        return Promise.resolve(true)
      }

    const response = await createAssetHttpHandler(state.config).handle(incoming)
    expect(response.status).toBe(503)
    await Bun.sleep(100)
    expect(observed).toBe(true)
    expect(cancelled).toBe(true)
    expect(state.dispatches()).toBe(0)
  })
}

for (const callback of ["authenticate", "policy", "verifyCsrf"] as const) {
  test(`${callback} blocking past wall clock prevents later dispatch`, async () => {
    const state = fixture()

    function block() {
      const end = Date.now() + 40

      while (Date.now() < end) {
        Math.sqrt(Date.now())
      }
    }

    if (callback === "authenticate")
      state.config.authenticate = function authenticate() {
        block()

        return Promise.resolve({
          status: "authenticated",
          identity: { provider: "better-auth", userId: "user" },
          credentialExpiresAt: Date.now() + 10000,
        })
      }
    else if (callback === "policy")
      state.config.policy = function policy() {
        block()

        return Promise.resolve(true)
      }
    else
      state.config.verifyCsrf = function verifyCsrf() {
        block()

        return Promise.resolve(true)
      }

    const response = await createAssetHttpHandler(state.config).handle(
      request(),
    )

    expect(response.status).toBe(503)
    expect(state.dispatches()).toBe(0)
  })
}

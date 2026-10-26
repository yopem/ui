import { EditorCollaborationProvider } from "@editor/collaboration-client"
import { describe, expect, spyOn, test } from "bun:test"

function createProvider(
  headers: (signal: AbortSignal) => HeadersInit | Promise<HeadersInit>,
) {
  let requests = 0

  const provider = new EditorCollaborationProvider({
    documentId: "doc:cancel",
    permission: "write",
    ticketUrl: "https://editor.test/collaboration/doc:cancel/ticket",
    socketUrl: "wss://editor.test/collaboration/doc:cancel/socket",
    connectTimeoutMs: 1000,
    headers,
    fetcher() {
      requests++

      return Promise.reject(new Error("Network fixture boundary"))
    },
    webSocketFactory() {
      throw new Error("Socket must not open in cancellation fixture")
    },
  })

  return { provider, requests: () => requests }
}

async function assertRejected(request: Promise<void>) {
  const cause = await request.then(
    () => undefined,
    (cause: unknown) => cause,
  )

  expect(cause).toBeInstanceOf(Error)
}

async function settle() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe("collaboration request cancellation", function requestCancellation() {
  test.each(["disconnect", "destroy"] as const)(
    "%s settles a pending header lookup without late dispatch",
    async function cancelPendingHeaders(action) {
      const pending = Promise.withResolvers<HeadersInit>()
      const signals: AbortSignal[] = []

      const { provider, requests } = createProvider(function headers(signal) {
        signals.push(signal)

        return pending.promise
      })

      const result = provider.connect().then(
        () => false,
        () => true,
      )

      try {
        expect(signals).toHaveLength(1)
        provider[action]()
        expect(signals[0].aborted).toBe(true)
        expect(await result).toBe(true)
        pending.resolve({ "X-CSRF-Token": "fixture" })
        await settle()
        expect(requests()).toBe(0)
      } finally {
        provider.destroy()
      }
    },
  )

  test("observes a rejected header promise when callback disconnects synchronously", async function rejectedAfterAbort() {
    const fixture = createProvider(function headers() {
      fixture.provider.disconnect()

      return Promise.reject(
        new Error("Header callback rejected after cancellation"),
      )
    })

    try {
      await assertRejected(fixture.provider.connect())
      await settle()
      expect(fixture.requests()).toBe(0)
    } finally {
      fixture.provider.destroy()
    }
  })

  test("does not dispatch if a header accessor disconnects during construction", async function cancelledHeaderConstruction() {
    const fixture = createProvider(function headers() {
      return {
        get "X-CSRF-Token"() {
          fixture.provider.disconnect()

          return "fixture"
        },
      }
    })

    try {
      await assertRejected(fixture.provider.connect())
      expect(fixture.requests()).toBe(0)
    } finally {
      fixture.provider.destroy()
    }
  })

  test("checks elapsed wall-clock budget before request dispatch", async function expiredHeaderBudget() {
    let now = 100000

    const fixture = createProvider(function headers() {
      now += 1001

      return { "X-CSRF-Token": "fixture" }
    })

    const clock = spyOn(Date, "now").mockImplementation(() => now)

    try {
      await assertRejected(fixture.provider.connect())
      expect(fixture.requests()).toBe(0)
    } finally {
      fixture.provider.destroy()
      clock.mockRestore()
    }
  })

  test("rejected header lookup never dispatches a request", async function rejectedHeaders() {
    const fixture = createProvider(function headers() {
      return Promise.reject(new Error("Host headers unavailable"))
    })

    try {
      await assertRejected(fixture.provider.connect())
      expect(fixture.requests()).toBe(0)
    } finally {
      fixture.provider.destroy()
    }
  })

  test("normal headers reach the configured network boundary", async function normalHeaders() {
    const fixture = createProvider(function headers() {
      return { "X-CSRF-Token": "fixture" }
    })

    try {
      await assertRejected(fixture.provider.connect())
      expect(fixture.requests()).toBe(1)
    } finally {
      fixture.provider.destroy()
    }
  })
})

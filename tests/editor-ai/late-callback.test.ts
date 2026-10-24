import type { AuthenticationResult } from "@editor/server/auth"

import { createEditorAiHandler } from "@editor/server/ai/http"
import { createOpenAiProvider } from "@editor/server/ai/providers"
import { expect, test } from "bun:test"

test("late noncooperative authentication cannot start policy or reservation", async () => {
  const authentication = Promise.withResolvers<AuthenticationResult>()
  let policies = 0
  let reservations = 0
  let providerCalls = 0

  const handler = createEditorAiHandler({
    trustedOrigin: "https://editor.example",
    provider: createOpenAiProvider({
      apiKey: "fixture",
      model: "host",
      system: "host",
      maxTokens: 8,
      transport() {
        providerCalls++

        return Promise.reject(new Error("unexpected provider"))
      },
    }),
    verifyCsrf: () => Promise.resolve(true),
    authenticate: () => authentication.promise,
    policy: () => {
      policies++

      return Promise.resolve(true)
    },
    reserve: () => {
      reservations++

      return Promise.resolve("reserved")
    },
    maxDurationMs: 30,
    maxInputBytes: 1024,
    maxOutputBytes: 1024,
  })

  const response = await handler(
    new Request("https://editor.example/ai", {
      method: "POST",
      headers: {
        origin: "https://editor.example",
        "content-type": "application/json",
        "x-editor-request": "1",
      },
      body: JSON.stringify({
        documentId: "doc",
        operation: "generate",
        instruction: "Draft",
      }),
    }),
  )

  expect(response.status).toBe(503)
  authentication.resolve({
    status: "authenticated",
    identity: { provider: "openauth", userId: "fixture" },
    credentialExpiresAt: Date.now() + 10000,
  })
  await Bun.sleep(10)
  expect(policies).toBe(0)
  expect(reservations).toBe(0)
  expect(providerCalls).toBe(0)
})

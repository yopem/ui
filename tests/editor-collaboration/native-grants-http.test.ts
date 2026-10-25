import type { AuthenticationResult } from "@editor/server/auth"
import type { JsonValue } from "@editor/server/document-model"

import {
  editorNativeRoomGrantSchema,
  type EditorNativeRoomGrant,
} from "@editor/collaboration-native-model"
import {
  createEditorNativeGrantsHttpHandler,
  type EditorNativeGrantsHttpOptions,
  type EditorNativeRoomGrantProvision,
} from "@editor/server/collaboration-native-grants"
import { expect, test } from "bun:test"

const origin = "https://editor.test"

const path = "/collaboration/native/grant"

const roomId = "workspace:shared-room"

const identity = { provider: "openauth", userId: "alice" } as const

function request(
  body: JsonValue = {
    roomId,
    displayName: "First collaborator",
    cursorColor: "#3466aa",
    requestedPermission: "write",
  },
  headers: Record<string, string> = {},
  signal?: AbortSignal,
  url = `${origin}${path}`,
) {
  const init: RequestInit = {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "X-CSRF-Token": "fixture-csrf",
      ...headers,
    },
    body: JSON.stringify(body),
  }

  if (signal) init.signal = signal

  return new Request(url, init)
}

function provision(
  overrides: Partial<EditorNativeRoomGrantProvision> = {},
): EditorNativeRoomGrantProvision {
  const credentialExpiresAt = Date.now() + 60000

  const scope = {
    roomId: overrides.roomId ?? roomId,
    generation: overrides.generation ?? "a".repeat(64),
    identity: overrides.identity ?? identity,
    permission: overrides.permission ?? "write",
    credentialExpiresAt,
  }

  const value: EditorNativeRoomGrantProvision = {
    roomId,
    generation: "a".repeat(64),
    seeded: true,
    identity,
    permission: "write",
    hocuspocus: {
      token: "configured-hocuspocus-credential",
      scope,
    },
    displayName: "First collaborator",
    cursorColor: "#3466aa",
    peer: {
      room: "trusted-room-generation-1",
      password: "host-issued-peer-credential-1234567890",
      scope: {
        ...scope,
        room: "trusted-room-generation-1",
        trustedWritersOnly: true,
      },
    },
  }

  return {
    ...value,
    ...overrides,
    hocuspocus: overrides.hocuspocus ?? value.hocuspocus,
    peer: overrides.peer === undefined ? value.peer : overrides.peer,
  }
}

function fixture(overrides: Partial<EditorNativeGrantsHttpOptions> = {}) {
  const calls = {
    authenticate: 0,
    policy: 0,
    csrf: 0,
    provision: 0,
    action: "",
  }

  const options: EditorNativeGrantsHttpOptions = {
    origin: overrides.origin ?? origin,
    path: overrides.path ?? path,
    timeoutMs: overrides.timeoutMs ?? 1000,
    maxConcurrent: overrides.maxConcurrent ?? 4,
    authenticate: async (request) => {
      calls.authenticate++

      if (overrides.authenticate) return await overrides.authenticate(request)

      return {
        status: "authenticated",
        identity,
        credentialExpiresAt: Date.now() + 120000,
      }
    },
    policy: async (input) => {
      calls.policy++
      calls.action = input.action

      if (overrides.policy) return await overrides.policy(input)

      return true
    },
    verifyCsrf: async (input) => {
      calls.csrf++

      if (overrides.verifyCsrf) return await overrides.verifyCsrf(input)

      return input.token === "fixture-csrf"
    },
    provision: async (input) => {
      calls.provision++

      if (overrides.provision) return await overrides.provision(input)

      return provision()
    },
  }

  const handler = createEditorNativeGrantsHttpHandler(options)

  return { handler, calls }
}

async function grantFrom(response: Response): Promise<EditorNativeRoomGrant> {
  const value: unknown = await response.json()

  return editorNativeRoomGrantSchema.parse(value)
}

test("returns host-issued seeded credentials in the native client shape", async () => {
  const value = provision()

  const body = {
    roomId,
    displayName: "First collaborator",
    cursorColor: "#3466aa",
    requestedPermission: "write",
  }

  const peer = value.peer

  if (!peer) throw new Error("writer peer credential missing")

  let provisionCalls = 0

  const f = fixture({
    authenticate: async (authenticationRequest) => {
      expect(await authenticationRequest.json()).toEqual(body)

      return {
        status: "authenticated",
        identity,
        credentialExpiresAt: Date.now() + 120000,
      }
    },
    verifyCsrf: async ({ request: csrfRequest, token }) => {
      expect(await csrfRequest.json()).toEqual(body)

      return token === "fixture-csrf"
    },
    provision: async ({ request: provisionRequest }) => {
      provisionCalls++
      expect(await provisionRequest.json()).toEqual(body)

      return value
    },
  })

  const response = await f.handler(request(body))

  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(response.headers.get("access-control-allow-origin")).toBeNull()
  expect(await grantFrom(response)).toEqual({
    roomId: value.roomId,
    generation: value.generation,
    seeded: true,
    permission: value.permission,
    credentialExpiresAt: value.hocuspocus.scope.credentialExpiresAt,
    hocuspocusToken: value.hocuspocus.token,
    displayName: value.displayName,
    cursorColor: value.cursorColor,
    peer: {
      room: peer.room,
      password: peer.password,
      trustedWritersOnly: true,
    },
  })
  expect(f.calls.action).toBe("collab:write")
  expect(f.calls.provision).toBe(1)
  expect(provisionCalls).toBe(1)
})

test("rejects invalid routes, methods, origins, media types, and strict JSON", async () => {
  const f = fixture()

  expect(
    (await f.handler(request(undefined, {}, undefined, `${origin}${path}?x=1`)))
      .status,
  ).toBe(403)
  expect(
    (await f.handler(request(undefined, { Origin: "https://attacker.test" })))
      .status,
  ).toBe(403)
  expect(
    (await f.handler(request(undefined, { "Content-Type": "text/plain" })))
      .status,
  ).toBe(415)
  expect(
    (
      await f.handler(
        request({
          roomId,
          displayName: "First collaborator",
          cursorColor: "#3466aa",
          requestedPermission: "write",
          identity,
        }),
      )
    ).status,
  ).toBe(400)

  const methodRequest = new Request(`${origin}${path}`, {
    method: "GET",
    headers: { Origin: origin },
  })

  const methodResponse = await f.handler(methodRequest)

  expect(methodResponse.status).toBe(405)
  expect(methodResponse.headers.get("allow")).toBe("POST")
  expect(f.calls.authenticate).toBe(0)
  expect(f.calls.provision).toBe(0)
})

test("bounds request body size before authentication", async () => {
  const f = fixture()

  const response = await f.handler(
    request({
      roomId,
      displayName: "x".repeat(20000),
      cursorColor: "#3466aa",
      requestedPermission: "write",
    }),
  )

  expect(response.status).toBe(413)
  expect(f.calls.authenticate).toBe(0)
})

test("cancels the original body producer after an oversized stream", async () => {
  let supplied = false
  let cancelled = false

  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (supplied) return new Promise<void>(() => undefined)
      supplied = true
      controller.enqueue(new Uint8Array(16385))
    },
    cancel() {
      cancelled = true
    },
  })

  const f = fixture()

  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "X-CSRF-Token": "fixture-csrf",
    },
    body,
    duplex: "half",
  }

  const response = await f.handler(new Request(`${origin}${path}`, init))

  expect(response.status).toBe(413)
  expect(cancelled).toBe(true)
  expect(f.calls.authenticate).toBe(0)
})

test("cancels the original body producer when request is aborted while reading", async () => {
  let startReading: (() => void) | undefined
  let cancelled = false

  const reading = new Promise<void>((resolve) => {
    startReading = resolve
  })

  const body = new ReadableStream<Uint8Array>({
    pull() {
      startReading?.()

      return new Promise<void>(() => undefined)
    },
    cancel() {
      cancelled = true
    },
  })

  const controller = new AbortController()
  const f = fixture()

  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "X-CSRF-Token": "fixture-csrf",
    },
    body,
    duplex: "half",
    signal: controller.signal,
  }

  const pending = f.handler(new Request(`${origin}${path}`, init))

  await reading
  controller.abort()
  const response = await pending

  expect(response.status).toBe(503)
  expect(cancelled).toBe(true)
  expect(f.calls.authenticate).toBe(0)
})

test("replays exact UTF-8 bytes and content headers to each host callback", async () => {
  const body = `{
  "roomId": "${roomId}",
  "displayName": "Zoë 🚀",
  "cursorColor": "#3466aa",
  "requestedPermission": "write"
}`

  const bytes = Array.from(new TextEncoder().encode(body))
  const contentLength = String(bytes.length)

  const observed: {
    method: string
    url: string
    contentType: string | null
    contentLength: string | null
    contentLanguage: string | null
    body: number[]
  }[] = []

  async function capture(callbackRequest: Request) {
    observed.push({
      method: callbackRequest.method,
      url: callbackRequest.url,
      contentType: callbackRequest.headers.get("content-type"),
      contentLength: callbackRequest.headers.get("content-length"),
      contentLanguage: callbackRequest.headers.get("content-language"),
      body: Array.from(new Uint8Array(await callbackRequest.arrayBuffer())),
    })
  }

  const f = fixture({
    authenticate: async (authenticationRequest) => {
      await capture(authenticationRequest)

      return {
        status: "authenticated",
        identity,
        credentialExpiresAt: Date.now() + 120000,
      }
    },
    policy: async ({ request: policyRequest }) => {
      await capture(policyRequest)

      return true
    },
    verifyCsrf: async ({ request: csrfRequest }) => {
      await capture(csrfRequest)

      return true
    },
    provision: async ({ request: provisionRequest }) => {
      await capture(provisionRequest)

      return provision()
    },
  })

  const response = await f.handler(
    new Request(`${origin}${path}`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": contentLength,
        "Content-Language": "en-US",
        "X-CSRF-Token": "fixture-csrf",
      },
      body,
    }),
  )

  expect(response.status).toBe(200)
  expect(observed).toEqual(
    Array.from({ length: 4 }, () => ({
      method: "POST",
      url: `${origin}${path}`,
      contentType: "application/json; charset=utf-8",
      contentLength,
      contentLanguage: "en-US",
      body: bytes,
    })),
  )
})

test("passes current deadline after credential expiry shortens it", async () => {
  const credentialExpiresAt = Date.now() + 15000
  let deadline: number | undefined

  const f = fixture({
    timeoutMs: 30000,
    authenticate: () =>
      Promise.resolve<AuthenticationResult>({
        status: "authenticated",
        identity,
        credentialExpiresAt,
      }),
    provision: (input) => {
      deadline = input.deadline
      const value = provision()
      const grantExpiresAt = credentialExpiresAt - 1000

      return Promise.resolve<EditorNativeRoomGrantProvision>({
        ...value,
        hocuspocus: {
          ...value.hocuspocus,
          scope: {
            ...value.hocuspocus.scope,
            credentialExpiresAt: grantExpiresAt,
          },
        },
        peer: value.peer
          ? {
              ...value.peer,
              scope: {
                ...value.peer.scope,
                credentialExpiresAt: grantExpiresAt,
              },
            }
          : null,
      })
    },
  })

  const response = await f.handler(request())

  expect(response.status).toBe(200)
  expect(deadline).toBe(credentialExpiresAt)
})

test("requires verified identity expiry, literal CSRF, and document policy approval", async () => {
  const expired = fixture({
    authenticate: () =>
      Promise.resolve<AuthenticationResult>({
        status: "authenticated",
        identity,
        credentialExpiresAt: Date.now() - 1,
      }),
  })

  expect((await expired.handler(request())).status).toBe(401)
  expect(expired.calls.provision).toBe(0)

  const csrfDenied = fixture({
    verifyCsrf: () => Promise.resolve<boolean | "unavailable">(false),
  })

  expect((await csrfDenied.handler(request())).status).toBe(403)
  expect(csrfDenied.calls.provision).toBe(0)

  const policyDenied = fixture({
    policy: () => Promise.resolve<boolean | "unavailable">(false),
  })

  expect((await policyDenied.handler(request())).status).toBe(403)
  expect(policyDenied.calls.action).toBe("collab:write")
  expect(policyDenied.calls.csrf).toBe(0)
  expect(policyDenied.calls.provision).toBe(0)

  const policyUnavailable = fixture({
    policy: () => Promise.resolve<boolean | "unavailable">("unavailable"),
  })

  expect((await policyUnavailable.handler(request())).status).toBe(503)
})

test("separates read grants from trusted writer peer credentials", async () => {
  const readFixture = fixture({
    provision: () =>
      Promise.resolve<EditorNativeRoomGrantProvision>(
        provision({ permission: "read", peer: null }),
      ),
  })

  const readResponse = await readFixture.handler(
    request({
      roomId,
      displayName: "Reader",
      cursorColor: "#3466aa",
      requestedPermission: "read",
    }),
  )

  expect(readResponse.status).toBe(200)
  expect((await grantFrom(readResponse)).peer).toBeNull()
  expect(readFixture.calls.action).toBe("collab:read")

  const readWithPeer = fixture({
    provision: () =>
      Promise.resolve<EditorNativeRoomGrantProvision>(
        provision({ permission: "read" }),
      ),
  })

  expect(
    (
      await readWithPeer.handler(
        request({
          roomId,
          displayName: "Reader",
          cursorColor: "#3466aa",
          requestedPermission: "read",
        }),
      )
    ).status,
  ).toBe(403)

  const trustedPeer = provision().peer

  if (!trustedPeer) throw new Error("writer peer credential missing")

  const untrustedPeer = fixture({
    provision: () =>
      Promise.resolve<EditorNativeRoomGrantProvision>(
        provision({
          peer: {
            ...trustedPeer,
            scope: { ...trustedPeer.scope, trustedWritersOnly: false },
          },
        }),
      ),
  })

  expect((await untrustedPeer.handler(request())).status).toBe(403)
})

test("rejects mismatched room, generation state, permission, identity, and expiry", async () => {
  const invalid: EditorNativeRoomGrantProvision[] = [
    provision({ roomId: "workspace:other-room" }),
    provision({ seeded: false }),
    provision({ permission: "read" }),
    provision({ identity: { provider: "better-auth", userId: "mallory" } }),
    (() => {
      const value = provision()
      const generation = "b".repeat(64)

      return provision({
        hocuspocus: {
          ...value.hocuspocus,
          scope: { ...value.hocuspocus.scope, generation },
        },
        peer: value.peer
          ? {
              ...value.peer,
              scope: { ...value.peer.scope, generation },
            }
          : null,
      })
    })(),
    (() => {
      const value = provision()
      const expiresAt = Date.now() + 60000

      return provision({
        hocuspocus: {
          token: "configured-hocuspocus-credential",
          scope: { ...value.hocuspocus.scope, credentialExpiresAt: expiresAt },
        },
        peer: value.peer
          ? {
              ...value.peer,
              scope: {
                ...value.peer.scope,
                credentialExpiresAt: expiresAt - 30000,
              },
            }
          : null,
      })
    })(),
  ]

  for (const value of invalid) {
    const f = fixture({
      provision: () => Promise.resolve<EditorNativeRoomGrantProvision>(value),
    })

    const response = await f.handler(request())

    expect(response.status).toBe(403)
    expect(await response.text()).not.toContain(
      "configured-hocuspocus-credential",
    )
  }
})

test("sanitizes callback failures and stops later callbacks after deadline", async () => {
  const failed = fixture({
    provision: () =>
      Promise.reject<EditorNativeRoomGrantProvision>(
        new Error("secret-host-token"),
      ),
  })

  const failureResponse = await failed.handler(request())

  expect(failureResponse.status).toBe(503)
  expect(await failureResponse.text()).not.toContain("secret-host-token")

  const timedOut = fixture({
    timeoutMs: 20,
    maxConcurrent: 1,
    policy: async () => {
      await new Promise<void>(() => undefined)

      return true
    },
  })

  expect((await timedOut.handler(request())).status).toBe(503)
  expect(timedOut.calls.provision).toBe(0)
  expect((await timedOut.handler(request())).status).toBe(503)
})

test("links request cancellation to callback signals and does not issue credentials", async () => {
  let start: (() => void) | undefined
  let callbackSignal: AbortSignal | undefined

  const started = new Promise<void>((resolve) => {
    start = resolve
  })

  const f = fixture({
    provision: async (input) => {
      callbackSignal = input.signal
      start?.()
      await new Promise<void>(() => undefined)

      return provision()
    },
  })

  const controller = new AbortController()
  const pending = f.handler(request(undefined, {}, controller.signal))

  await started
  controller.abort()
  const response = await pending

  expect(response.status).toBe(503)
  expect(callbackSignal?.aborted).toBe(true)
  expect(f.calls.provision).toBe(1)
})

test("rejects excess concurrency while an authenticated grant is pending", async () => {
  let start: (() => void) | undefined
  let release: (() => void) | undefined

  const started = new Promise<void>((resolve) => {
    start = resolve
  })

  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  const f = fixture({
    maxConcurrent: 1,
    provision: async () => {
      start?.()
      await gate

      return provision()
    },
  })

  const first = f.handler(request())

  await started
  const second = await f.handler(request())

  expect(second.status).toBe(503)
  release?.()
  expect((await first).status).toBe(200)
})

test("preserves opaque authenticated identity bytes for policy and credentials", async () => {
  const opaqueIdentity = { ...identity, userId: " alice " }

  const f = fixture({
    authenticate() {
      return Promise.resolve({
        status: "authenticated",
        identity: opaqueIdentity,
        credentialExpiresAt: Date.now() + 120000,
      })
    },
    policy(input) {
      expect(input.identity).toEqual(opaqueIdentity)

      return true
    },
    provision(input) {
      expect(input.identity).toEqual(opaqueIdentity)

      return provision({ identity: opaqueIdentity })
    },
  })

  expect((await f.handler(request())).status).toBe(200)
  expect(f.calls.policy).toBe(1)
})

test("rejects credential scopes for a different whitespace-bearing identity", async () => {
  const f = fixture({
    provision() {
      return provision({ identity: { ...identity, userId: " alice " } })
    },
  })

  expect((await f.handler(request())).status).toBe(403)
})

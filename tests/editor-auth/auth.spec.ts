import {
  authorizeEditorRequest,
  createBetterAuthAuthentication,
  createOpenAuthAuthentication,
  type AuthenticationResult,
} from "@yopem-ui/editor/server"
import { betterAuth } from "better-auth"
import { getMigrations } from "better-auth/db/migration"
import { Database } from "bun:sqlite"
import { afterAll, describe, expect, test } from "bun:test"
import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose"

const user = {
  id: "user-123",
  email: "user@example.com",
  name: null,
  username: "user",
  image: null,
  role: "user",
}

const authenticated: AuthenticationResult = {
  status: "authenticated",
  identity: { provider: "openauth", userId: user.id },
}

const request = new Request("https://editor.example.com/documents/1")

const keys = await generateKeyPair("ES256")

const jwk = {
  ...(await exportJWK(keys.publicKey)),
  kid: "fixture",
  alg: "ES256",
  use: "sig",
}

let jwksStatus = 200

let jwksRequests = 0

const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  fetch() {
    jwksRequests++

    return Response.json({ keys: [jwk] }, { status: jwksStatus })
  },
})

const issuer = server.url.origin

const options = {
  issuer,
  audience: "editor-client",
  allowInsecureLocalhost: true,
}

function token(overrides: JWTPayload = {}, signingKey = keys.privateKey) {
  return new SignJWT({
    mode: "access",
    type: "user",
    properties: user,
    iss: issuer,
    aud: "editor-client",
    sub: "mutable-hash",
    exp: Math.floor(Date.now() / 1000) + 60,
    ...overrides,
  })
    .setProtectedHeader({ alg: "ES256", kid: "fixture" })
    .sign(signingKey)
}

function bearer(value: string) {
  return new Request(request, { headers: { authorization: `Bearer ${value}` } })
}

afterAll(() => server.stop(true))

describe("OpenAuth signed protocol", () => {
  test("uses properties.id, accepts case-insensitive Bearer, and caches trusted JWKS", async () => {
    const authenticate = createOpenAuthAuthentication(options)
    const jwt = await token()
    const before = jwksRequests
    expect(await authenticate(bearer(jwt))).toEqual(authenticated)
    expect(
      await authenticate(
        new Request(request, { headers: { authorization: `bearer ${jwt}` } }),
      ),
    ).toEqual(authenticated)
    expect(jwksRequests - before).toBe(1)
    expect(
      await authenticate(bearer(await token({ sub: "changed-hash" }))),
    ).toEqual(authenticated)
  })
  test("rejects missing, malformed, or cookie-only credentials without fetching", async () => {
    const authenticate = createOpenAuthAuthentication(options)
    const before = jwksRequests

    const credentials: HeadersInit[] = [
      {},
      { authorization: "Basic abc" },
      { authorization: "Bearer a b" },
      { authorization: "Bearer garbage" },
      { cookie: "session=anything" },
    ]

    for (const headers of credentials) {
      expect(await authenticate(new Request(request, { headers }))).toEqual({
        status: "unauthenticated",
      })
    }

    expect(jwksRequests).toBe(before)
  })
  test("rejects oversized access tokens before key lookup", async () => {
    const authenticate = createOpenAuthAuthentication(options)

    const oversized = await token({
      properties: { ...user, name: "x".repeat(16_384) },
    })

    const before = jwksRequests

    expect(await authenticate(bearer(oversized))).toEqual({
      status: "unauthenticated",
    })
    expect(jwksRequests).toBe(before)
  })
  test("rejects invalid claims and signatures", async () => {
    const authenticate = createOpenAuthAuthentication(options)

    const invalidClaims: JWTPayload[] = [
      { exp: 1 },
      { exp: undefined },
      { nbf: Math.floor(Date.now() / 1000) + 120 },
      { iss: "https://attacker.example.com" },
      { aud: "other-client" },
      { aud: undefined },
      { mode: "refresh" },
      { type: "other" },
      { properties: { ...user, id: " " } },
      { properties: { ...user, email: 1 } },
      { properties: { ...user, name: undefined } },
      { properties: { ...user, role: "owner" } },
      { properties: null },
    ]

    for (const claims of invalidClaims)
      expect(await authenticate(bearer(await token(claims)))).toEqual({
        status: "unauthenticated",
      })
    const other = await generateKeyPair("ES256")
    expect(
      await authenticate(bearer(await token({}, other.privateKey))),
    ).toEqual({ status: "unauthenticated" })

    const hmac = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .sign(new Uint8Array(32))

    expect(await authenticate(bearer(hmac))).toEqual({
      status: "unauthenticated",
    })
    expect(
      await authenticate(bearer(await token({}, keys.privateKey))),
    ).toEqual(authenticated)
  })
  test("reports unavailable JWKS, not bad credentials", async () => {
    jwksStatus = 503

    try {
      expect(
        await createOpenAuthAuthentication(options)(bearer(await token())),
      ).toEqual({ status: "unavailable" })
    } finally {
      jwksStatus = 200
    }
  })
  test("rejects untrusted issuer configuration and empty audiences", () => {
    for (const issuer of [
      "http://auth.example.com",
      "https://user:pass@auth.example.com",
      "https://auth.example.com/path",
      "https://auth.example.com?x=1",
      "http://127.0.0.1",
    ]) {
      expect(() =>
        createOpenAuthAuthentication({ issuer, audience: "editor" }),
      ).toThrow()
    }

    expect(() => createOpenAuthAuthentication({ audience: " " })).toThrow()
    expect(() =>
      createOpenAuthAuthentication({
        issuer: "http://attacker.example.com",
        audience: "editor",
        allowInsecureLocalhost: true,
      }),
    ).toThrow()
    expect(() =>
      createOpenAuthAuthentication({ audience: "editor" }),
    ).not.toThrow()
  })
})

const database = new Database(":memory:")

const authOptions = {
  database,
  baseURL: "http://localhost:3201",
  secret: "editor-auth-fixture-secret-at-least-32-characters",
  emailAndPassword: { enabled: true },
  session: { cookieCache: { enabled: true } },
}

const migration = await getMigrations(authOptions)

await migration.runMigrations()

const auth = betterAuth(authOptions)

afterAll(() => database.close())

describe("Better Auth host integration", () => {
  test("verifies real signed cookies and rejects revoked cached sessions", async () => {
    const signup = await auth.api.signUpEmail({
      body: {
        email: "fixture@example.com",
        password: "test-password-123",
        name: "Fixture",
      },
      asResponse: true,
    })

    expect(signup.status).toBe(200)

    const cookies = signup.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ")

    expect(cookies).toContain("session_token=")
    const headers = new Headers({ cookie: cookies })
    const session = await auth.api.getSession({ headers })
    expect(session).not.toBeNull()

    if (!session) throw new Error("Fixture session missing")
    expect(cookies).toContain("session_data=")
    const cachedHeaders = new Headers(headers)

    const authenticate = createBetterAuthAuthentication({
      getSession: auth.api.getSession,
    })

    expect(await authenticate(new Request(request, { headers }))).toEqual({
      status: "authenticated",
      identity: { provider: "better-auth", userId: session.user.id },
    })
    expect(await authenticate(request)).toEqual({ status: "unauthenticated" })
    expect(
      await authenticate(
        new Request(request, {
          headers: {
            cookie: cookies.replace("session_token=", "session_token=invalid"),
          },
        }),
      ),
    ).toEqual({ status: "unauthenticated" })
    await auth.api.signOut({ headers })
    expect(
      await authenticate(new Request(request, { headers: cachedHeaders })),
    ).toEqual({ status: "unauthenticated" })
  })
  test("forwards exact headers and bypasses cookie cache", async () => {
    const authenticate = createBetterAuthAuthentication({
      getSession: (input) => {
        expect(input.headers).toBe(request.headers)
        expect(input.query).toEqual({ disableCookieCache: true })

        return Promise.resolve({
          user: { id: "host-user", extra: true },
          session: { expiresAt: new Date(Date.now() + 60_000) },
        })
      },
    })

    expect(await authenticate(request)).toEqual({
      status: "authenticated",
      identity: { provider: "better-auth", userId: "host-user" },
    })
  })
  test("fails closed on malformed/expired results and getter errors", async () => {
    for (const value of [
      null,
      {},
      {
        user: { id: " " },
        session: { expiresAt: new Date(Date.now() + 60_000) },
      },
      { user: { id: "id" }, session: { expiresAt: new Date(0) } },
      { user: { id: "id" }, session: { expiresAt: "invalid" } },
      { user: { id: "id" } },
    ]) {
      expect(
        await createBetterAuthAuthentication({
          getSession: () => Promise.resolve(value),
        })(request),
      ).toEqual({ status: "unauthenticated" })
    }

    expect(
      await createBetterAuthAuthentication({
        getSession: () =>
          Promise.resolve({
            user: { id: "id" },
            session: { expiresAt: new Date(Date.now() + 60_000).toISOString() },
          }),
      })(request),
    ).toEqual({
      status: "authenticated",
      identity: { provider: "better-auth", userId: "id" },
    })
    expect(
      await createBetterAuthAuthentication({
        getSession: () => Promise.reject(new Error("offline")),
      })(request),
    ).toEqual({ status: "unavailable" })
  })
})

describe("explicit document authorization", () => {
  test("only explicit allow permits protected effects for each action", async () => {
    for (const action of [
      "document:read",
      "document:write",
      "ai:invoke",
      "upload:create",
      "collab:read",
      "collab:write",
    ] as const) {
      let effects = 0

      const result = await authorizeEditorRequest({
        request,
        documentId: "document-1",
        action,
        authenticate: () => Promise.resolve(authenticated),
        policy: (input) => {
          expect(input).toEqual({
            request,
            documentId: "document-1",
            action,
            identity: authenticated.identity,
          })

          return true
        },
      })

      if (result.status === "authorized") effects++
      expect(effects).toBe(1)
      expect(result).toEqual({
        status: "authorized",
        identity: authenticated.identity,
      })
    }
  })
  test("denial, invalid input, and outages never run protected effects", async () => {
    for (const scenario of [
      "anonymous",
      "offline",
      "auth-throw",
      "deny",
      "policy-throw",
      "policy-unavailable",
      "not-true",
      "empty-id",
      "bad-action",
      "bad-identity",
    ] as const) {
      let effects = 0
      let policyCalls = 0

      const result = await authorizeEditorRequest({
        request,
        documentId: scenario === "empty-id" ? " " : "doc",
        action: scenario === "bad-action" ? "unknown" : "document:write",
        authenticate: () => {
          if (scenario === "auth-throw")
            return Promise.reject(new Error("offline"))

          if (scenario === "anonymous")
            return Promise.resolve({ status: "unauthenticated" })

          if (scenario === "offline")
            return Promise.resolve({ status: "unavailable" })

          if (scenario === "bad-identity")
            return Promise.resolve<AuthenticationResult>({
              status: "authenticated",
              identity: { provider: "openauth", userId: " " },
            })

          return Promise.resolve(authenticated)
        },
        policy: () => {
          policyCalls++

          if (scenario === "policy-throw") throw new Error("offline")

          if (scenario === "policy-unavailable") return "unavailable"

          return scenario === "not-true" ? "allow" : false
        },
      })

      if (result.status === "authorized") effects++
      expect(effects).toBe(0)
      expect(result).toEqual({
        status: "rejected",
        statusCode: [
          "offline",
          "auth-throw",
          "policy-throw",
          "policy-unavailable",
        ].includes(scenario)
          ? 503
          : ["deny", "not-true"].includes(scenario)
            ? 403
            : 401,
      })
      expect(policyCalls).toBe(
        ["deny", "not-true", "policy-throw", "policy-unavailable"].includes(
          scenario,
        )
          ? 1
          : 0,
      )
    }
  })
})

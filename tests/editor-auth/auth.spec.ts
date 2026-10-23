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
import {
  CompactSign,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTPayload,
} from "jose"

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

const jwtExpiresAt = Math.floor(Date.now() / 1000) + 60

const verifiedAuthentication = {
  ...authenticated,
  credentialExpiresAt: jwtExpiresAt * 1000,
}

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
    exp: jwtExpiresAt,
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
    expect(await authenticate(bearer(jwt))).toEqual(verifiedAuthentication)
    expect(
      await authenticate(
        new Request(request, { headers: { authorization: `bearer ${jwt}` } }),
      ),
    ).toEqual(verifiedAuthentication)
    expect(jwksRequests - before).toBe(1)
    expect(
      await authenticate(bearer(await token({ sub: "changed-hash" }))),
    ).toEqual(verifiedAuthentication)
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
      { exp: jwtExpiresAt + 0.5 },
      { exp: Number.MAX_SAFE_INTEGER },
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

    for (const exp of ["1e400", "-1e400", "null", '"later"']) {
      const payload = JSON.stringify({
        mode: "access",
        type: "user",
        properties: user,
        iss: issuer,
        aud: options.audience,
      })

      const jwt = await new CompactSign(
        new TextEncoder().encode(`${payload.slice(0, -1)},"exp":${exp}}`),
      )
        .setProtectedHeader({ alg: "ES256", kid: "fixture" })
        .sign(keys.privateKey)

      expect(await authenticate(bearer(jwt))).toEqual({
        status: "unauthenticated",
      })
    }

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
    ).toEqual(verifiedAuthentication)
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
  test("verification does not refresh a refresh-eligible stored session", async () => {
    const signup = await auth.api.signUpEmail({
      body: {
        email: "aged@example.com",
        password: "test-password-123",
        name: "Aged",
      },
      asResponse: true,
    })

    expect(signup.status).toBe(200)

    const cookies = signup.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ")

    const headers = new Headers({ cookie: cookies })

    const session = await auth.api.getSession({
      headers,
      query: { disableCookieCache: true, disableRefresh: true },
    })

    if (!session) throw new Error("Fixture session missing")
    const expiresAt = Math.floor(Date.now() / 1000) * 1000 + 60_000
    database
      .query("UPDATE session SET expiresAt = ?, updatedAt = ? WHERE id = ?")
      .run(
        new Date(expiresAt).toISOString(),
        new Date(expiresAt - 7 * 86400_000).toISOString(),
        session.session.id,
      )
    const before = database.query("SELECT * FROM session ORDER BY id").all()
    const usersBefore = database.query("SELECT * FROM user ORDER BY id").all()

    const changesBefore = database
      .query("SELECT total_changes() AS changes")
      .get()

    const responseHeaders: Headers[] = []

    const authenticate = createBetterAuthAuthentication({
      async getSession(input) {
        const result = await auth.api.getSession({
          ...input,
          returnHeaders: true,
        })

        responseHeaders.push(result.headers)

        return result.response
      },
    })

    for (let attempt = 0; attempt < 2; attempt++) {
      expect(await authenticate(new Request(request, { headers }))).toEqual({
        status: "authenticated",
        identity: { provider: "better-auth", userId: session.user.id },
        credentialExpiresAt: expiresAt,
      })
    }

    expect(responseHeaders).toHaveLength(2)

    for (const resultHeaders of responseHeaders)
      expect(resultHeaders.getSetCookie()).toEqual([])
    expect(database.query("SELECT * FROM session ORDER BY id").all()).toEqual(
      before,
    )
    expect(database.query("SELECT * FROM user ORDER BY id").all()).toEqual(
      usersBefore,
    )
    expect(database.query("SELECT total_changes() AS changes").get()).toEqual(
      changesBefore,
    )

    const refreshed = await auth.api.getSession({
      headers,
      query: { disableCookieCache: true },
      returnHeaders: true,
    })

    expect(refreshed.response?.session.expiresAt.getTime()).toBeGreaterThan(
      expiresAt,
    )
    expect(
      refreshed.headers
        .getSetCookie()
        .some((value) => value.includes("session_token=")),
    ).toBe(true)
    expect(
      database.query("SELECT total_changes() AS changes").get(),
    ).not.toEqual(changesBefore)
  })

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
      credentialExpiresAt: session.session.expiresAt.getTime(),
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
  test("forwards exact headers and disables cache and refresh", async () => {
    const expiresAt = new Date(Date.now() + 60_000)

    const authenticate = createBetterAuthAuthentication({
      getSession: (input) => {
        expect(input.headers).toBe(request.headers)
        expect(input.query).toEqual({
          disableCookieCache: true,
          disableRefresh: true,
        })

        return Promise.resolve({
          user: { id: "host-user", extra: true },
          session: { expiresAt },
        })
      },
    })

    expect(await authenticate(request)).toEqual({
      status: "authenticated",
      identity: { provider: "better-auth", userId: "host-user" },
      credentialExpiresAt: expiresAt.getTime(),
    })
  })
  test("fails closed on malformed/expired results and getter errors", async () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString()

    for (const value of [
      null,
      {},
      {
        user: { id: " " },
        session: { expiresAt: new Date(Date.now() + 60_000) },
      },
      { user: { id: "id" }, session: { expiresAt: new Date(0) } },
      { user: { id: "id" }, session: { expiresAt: "invalid" } },
      { user: { id: "id" }, session: { expiresAt: new Date(NaN) } },
      { user: { id: "id" }, session: { expiresAt: new Date(Date.now()) } },
      { user: { id: "id" }, session: { expiresAt: Infinity } },
      { user: { id: "id" }, session: { expiresAt: Date.now() + 60_000 } },
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
            session: { expiresAt },
          }),
      })(request),
    ).toEqual({
      status: "authenticated",
      identity: { provider: "better-auth", userId: "id" },
      credentialExpiresAt: new Date(expiresAt).getTime(),
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

describe("verified credential expiry authorization", () => {
  test("forwards exact expiry without changing identity", async () => {
    const credentialExpiresAt = Date.now() + 60_000

    const result = await authorizeEditorRequest({
      request,
      documentId: "doc",
      action: "document:read",
      authenticate: () =>
        Promise.resolve({ ...authenticated, credentialExpiresAt }),
      policy: () => true,
    })

    expect(result).toEqual({
      status: "authorized",
      identity: authenticated.identity,
      credentialExpiresAt,
    })
  })
  test("rejects malformed supplied expiry before policy", async () => {
    for (const credentialExpiresAt of [
      0,
      -1,
      Date.now(),
      Date.now() - 1,
      Date.now() + 60_000.5,
      Number.MAX_SAFE_INTEGER + 1,
      NaN,
      Infinity,
      -Infinity,
      null,
      "later",
      true,
      {},
    ]) {
      let policyCalls = 0

      const authentication = Object.defineProperty(
        { ...authenticated },
        "credentialExpiresAt",
        { value: credentialExpiresAt },
      )

      const result = await authorizeEditorRequest({
        request,
        documentId: "doc",
        action: "document:read",
        authenticate: () => Promise.resolve(authentication),
        policy: () => {
          policyCalls++

          return true
        },
      })

      expect(result).toEqual({ status: "rejected", statusCode: 401 })
      expect(policyCalls).toBe(0)
    }
  })
  test("rejects expiry reached while policy runs", async () => {
    const credentialExpiresAt = Date.now() + 30

    const result = await authorizeEditorRequest({
      request,
      documentId: "doc",
      action: "document:read",
      authenticate: () =>
        Promise.resolve({ ...authenticated, credentialExpiresAt }),
      policy: async () => {
        await Bun.sleep(50)

        return true
      },
    })

    expect(result).toEqual({ status: "rejected", statusCode: 401 })
  })
  test("valid expiry never overrides denial or outage", async () => {
    for (const decision of [false, "true", 1, {}, "unavailable"]) {
      const result = await authorizeEditorRequest({
        request,
        documentId: "doc",
        action: "document:read",
        authenticate: () =>
          Promise.resolve({
            ...authenticated,
            credentialExpiresAt: Date.now() + 60_000,
          }),
        policy: () => decision,
      })

      expect(result).toEqual({
        status: "rejected",
        statusCode: decision === "unavailable" ? 503 : 403,
      })
    }
  })
})

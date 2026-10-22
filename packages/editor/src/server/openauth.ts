import { createRemoteJWKSet, errors, jwtVerify } from "jose"
import { z } from "zod"

import type { AuthenticationResult } from "./auth"

export interface OpenAuthAuthenticationOptions {
  audience: string
  issuer?: string
  allowInsecureLocalhost?: boolean
}

const subjectSchema = z.object({
  mode: z.literal("access"),
  type: z.literal("user"),
  properties: z.object({
    id: z.string().refine((value) => value.trim().length > 0),
    email: z.string(),
    name: z.string().nullable(),
    username: z.string(),
    image: z.string().nullable(),
    role: z.enum(["user", "member", "admin"]).default("user"),
  }),
})

export function createOpenAuthAuthentication(
  options: OpenAuthAuthenticationOptions,
) {
  const audience = options.audience

  if (!z.string().trim().min(1).safeParse(audience).success) {
    throw new Error("OpenAuth requires an accepted audience")
  }

  const issuer = new URL(options.issuer ?? "https://auth.yopem.com")

  const localHttp =
    options.allowInsecureLocalhost === true &&
    issuer.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(issuer.hostname)

  if (
    (!localHttp && issuer.protocol !== "https:") ||
    issuer.username ||
    issuer.password ||
    issuer.pathname !== "/" ||
    issuer.search ||
    issuer.hash
  ) {
    throw new Error("OpenAuth issuer must be an HTTPS origin")
  }

  const jwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", issuer), {
    timeoutDuration: 5000,
    cacheMaxAge: 600_000,
    cooldownDuration: 30_000,
  })

  return async function authenticateOpenAuth(
    request: Request,
  ): Promise<AuthenticationResult> {
    const credential = /^Bearer ([^\s]+)$/i.exec(
      request.headers.get("authorization") ?? "",
    )

    if (!credential?.[1] || credential[1].length > 16_384)
      return { status: "unauthenticated" }

    try {
      const { payload } = await jwtVerify(credential[1], jwks, {
        issuer: issuer.origin,
        audience,
        algorithms: ["ES256"],
        requiredClaims: ["exp"],
      })

      const subject = subjectSchema.safeParse(payload)

      if (!subject.success) return { status: "unauthenticated" }

      return {
        status: "authenticated",
        identity: { provider: "openauth", userId: subject.data.properties.id },
      }
    } catch (error) {
      if (
        error instanceof errors.JWTClaimValidationFailed ||
        error instanceof errors.JWTExpired ||
        error instanceof errors.JWTInvalid ||
        error instanceof errors.JWSInvalid ||
        error instanceof errors.JWSSignatureVerificationFailed ||
        error instanceof errors.JOSEAlgNotAllowed ||
        error instanceof errors.JWKSNoMatchingKey ||
        error instanceof errors.JOSENotSupported
      ) {
        return { status: "unauthenticated" }
      }

      return { status: "unavailable" }
    }
  }
}

import { z } from "zod"

import type { AuthenticationResult } from "./auth"

export type BetterAuthSessionGetter<Session> = (input: {
  headers: Headers
  query: { disableCookieCache: true; disableRefresh: true }
}) => Promise<Session>

const sessionSchema = z.object({
  user: z.object({ id: z.string().refine((value) => value.trim().length > 0) }),
  session: z.object({
    expiresAt: z.union([
      z.date(),
      z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    ]),
  }),
})

export function createBetterAuthAuthentication<Session>(options: {
  getSession: BetterAuthSessionGetter<Session>
}) {
  return async function authenticateBetterAuth(
    request: Request,
  ): Promise<AuthenticationResult> {
    try {
      const result = await options.getSession({
        headers: request.headers,
        query: { disableCookieCache: true, disableRefresh: true },
      })

      const session = sessionSchema.safeParse(result)

      if (
        !session.success ||
        !Number.isSafeInteger(session.data.session.expiresAt.getTime()) ||
        session.data.session.expiresAt.getTime() <= Date.now()
      ) {
        return { status: "unauthenticated" }
      }

      return {
        status: "authenticated",
        identity: { provider: "better-auth", userId: session.data.user.id },
        credentialExpiresAt: session.data.session.expiresAt.getTime(),
      }
    } catch {
      return { status: "unavailable" }
    }
  }
}

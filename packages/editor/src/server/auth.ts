import { z } from "zod"

const identitySchema = z.object({
  provider: z.enum(["openauth", "better-auth"]),
  userId: z.string().trim().min(1),
})

const actionSchema = z.enum([
  "document:read",
  "document:write",
  "ai:invoke",
  "upload:create",
  "collab:read",
  "collab:write",
])

export type EditorIdentity = z.infer<typeof identitySchema>

export type EditorAction = z.infer<typeof actionSchema>

export type AuthenticationResult =
  | {
      status: "authenticated"
      identity: EditorIdentity
      credentialExpiresAt?: number
    }
  | { status: "unauthenticated" }
  | { status: "unavailable" }

export type EditorAuthentication = (
  request: Request,
) => Promise<AuthenticationResult>

export interface EditorAuthorizationInput {
  request: Request
  identity: EditorIdentity
  documentId: string
  action: EditorAction
}

export type EditorAuthorizationResult =
  | {
      status: "authorized"
      identity: EditorIdentity
      credentialExpiresAt?: number
    }
  | { status: "rejected"; statusCode: 401 | 403 | 503 }

export async function authorizeEditorRequest<Decision>(options: {
  request: Request
  documentId: string
  action: string
  authenticate: EditorAuthentication
  policy: (input: EditorAuthorizationInput) => Decision | Promise<Decision>
}): Promise<EditorAuthorizationResult> {
  const action = actionSchema.safeParse(options.action)

  if (
    !action.success ||
    !z.string().trim().min(1).safeParse(options.documentId).success
  ) {
    return { status: "rejected", statusCode: 401 }
  }

  try {
    const authentication = await options.authenticate(options.request)

    if (authentication.status === "unavailable")
      return { status: "rejected", statusCode: 503 }

    if (
      authentication.status !== "authenticated" ||
      !identitySchema.safeParse(authentication.identity).success
    ) {
      return { status: "rejected", statusCode: 401 }
    }

    const { credentialExpiresAt } = authentication

    if (
      credentialExpiresAt !== undefined &&
      (!Number.isSafeInteger(credentialExpiresAt) ||
        credentialExpiresAt <= Date.now())
    ) {
      return { status: "rejected", statusCode: 401 }
    }

    const allowed = await options.policy({
      request: options.request,
      identity: authentication.identity,
      documentId: options.documentId,
      action: action.data,
    })

    if (allowed === "unavailable")
      return { status: "rejected", statusCode: 503 }

    if (allowed !== true) return { status: "rejected", statusCode: 403 }

    if (credentialExpiresAt !== undefined) {
      if (credentialExpiresAt <= Date.now())
        return { status: "rejected", statusCode: 401 }

      return {
        status: "authorized",
        identity: authentication.identity,
        credentialExpiresAt,
      }
    }

    return { status: "authorized", identity: authentication.identity }
  } catch {
    return { status: "rejected", statusCode: 503 }
  }
}

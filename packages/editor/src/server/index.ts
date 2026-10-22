export { authorizeEditorRequest } from "./auth"

export type {
  AuthenticationResult,
  EditorAction,
  EditorAuthentication,
  EditorAuthorizationInput,
  EditorAuthorizationResult,
  EditorIdentity,
} from "./auth"

export { createBetterAuthAuthentication } from "./better-auth"

export type { BetterAuthSessionGetter } from "./better-auth"

export { createOpenAuthAuthentication } from "./openauth"

export type { OpenAuthAuthenticationOptions } from "./openauth"

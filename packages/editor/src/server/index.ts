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

export { createDocumentHttpHandler } from "./document-http"

export type { DocumentHttpOptions, DocumentHttpDecision } from "./document-http"

export { createD1DocumentService } from "./document-d1"

export type { DocumentD1Binding } from "./document-d1"

export { createPostgresDocumentService } from "./document-postgres"

export type { DocumentPgPool, DocumentPgClient } from "./document-postgres"

export { DocumentError } from "./document-model"

export type {
  DocumentConfig,
  DocumentContext,
  DocumentMutation,
  DocumentRecord,
  DocumentResult,
  ExpectedDocument,
  JsonValue,
} from "./document-model"

import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorAuthItem: SourceItem = {
  categories: ["utility"],
  dependencies: [editorDependency("jose"), editorDependency("zod")],
  description:
    "Connects editor backends to existing OpenAuth and Better Auth services.",
  devDependencies: [],
  docs: {
    api: [
      "createOpenAuthAuthentication",
      "createBetterAuthAuthentication",
      "authorizeEditorRequest",
      "EditorIdentity",
      "EditorAction",
      "AuthenticationResult",
      "EditorAuthentication",
      "EditorAuthorizationInput",
      "EditorAuthorizationResult",
      "OpenAuthAuthenticationOptions",
      "BetterAuthSessionGetter",
    ],
    usage:
      "Import server helpers from @/lib/editor-auth. Select one authentication adapter. Supply a separate document policy. Keep credentials and these helpers on the server. Validate route origins and CSRF tokens before mutations.",
  },
  files: ["index.ts", "auth.ts", "openauth.ts", "better-auth.ts"].map(
    (file) => ({
      path: `lib/editor-auth/${file}`,
      target: `@/lib/editor-auth/${file}`,
      type: "registry:lib",
    }),
  ),
  name: "editor-auth",
  peerDependencies: [],
  registryDependencies: [],
  title: "Editor authentication",
  type: "registry:lib",
}

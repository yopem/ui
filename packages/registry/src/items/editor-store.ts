import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorStoreItem: SourceItem = {
  categories: ["utility"],
  dependencies: [editorDependency("zod")],
  description:
    "Stores authenticated editor snapshots with D1 or PostgreSQL conditional writes.",
  devDependencies: [],
  docs: {
    api: [
      "createDocumentHttpHandler",
      "createD1DocumentService",
      "createPostgresDocumentService",
      "DocumentHttpOptions",
      "DocumentConfig",
      "DocumentError",
    ],
    usage:
      "Import server helpers from @/lib/editor-store. Apply one copied SQL migration. Supply existing authentication, document policy, CSRF verification, and complete Lexical validation. See /docs/editor-store.",
  },
  files: [
    "index.ts",
    "document-http.ts",
    "document-model.ts",
    "document-validation.ts",
    "document-service.ts",
    "document-sql.ts",
    "document-d1.ts",
    "document-postgres.ts",
    "migrations/d1/0001-document-snapshots.sql",
    "migrations/postgres/0001-document-snapshots.sql",
  ].map((file) => ({
    path: `lib/editor-store/${file}`,
    target: `@/lib/editor-store/${file}`,
    type: "registry:lib",
  })),
  name: "editor-store",
  peerDependencies: [],
  registryDependencies: ["editor-auth"],
  title: "Editor document storage",
  type: "registry:lib",
}

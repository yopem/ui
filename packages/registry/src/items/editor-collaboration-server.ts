import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorCollaborationServerItem: SourceItem = {
  name: "editor-collaboration-server",
  title: "Editor collaboration server",
  type: "registry:lib",
  categories: ["utility"],
  description:
    "Supplies bounded collaboration adapters for Durable Objects with D1 or PostgreSQL with host WebSocket upgrades.",
  dependencies: [
    editorDependency("@lexical/yjs"),
    editorDependency("lexical"),
    editorDependency("yjs"),
    editorDependency("y-protocols"),
    editorDependency("lib0"),
    editorDependency("zod"),
  ],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor-store", "editor-auth"],
  files: [
    "index.ts",
    "collaboration-d1.ts",
    "collaboration-http.ts",
    "collaboration-initialize.ts",
    "collaboration-postgres.ts",
    "collaboration-session.ts",
    "collaboration-tickets.ts",
    "collaboration/protocol.ts",
    "collaboration/preflight.ts",
    "collaboration/0002-collaboration.sql",
    "collaboration/0003-collaboration-runtime.sql",
  ].map((file) => ({
    path: `lib/editor-collaboration/${file}`,
    target: `@/lib/editor-collaboration/${file}`,
    type: "registry:lib",
  })),
  docs: {
    api: [
      "createD1CollaborationCanonical",
      "createEditorCollaborationHttpHandler",
      "createEditorCollaborationInitializer",
      "createPostgresCollaborationLog",
      "createPostgresCollaborationTicketStore",
      "createPostgresEditorCollaborationSessions",
      "EditorCollaborationHttpOptions",
      "EditorCollaborationInitializerOptions",
      "EditorCollaborationSessionOptions",
      "EditorCollaborationUpgrade",
      "EditorCollaborationSocketCallbacks",
      "CollaborationTransactions",
      "CollaborationLogConfig",
      "CollaborationError",
      "collaborationLimits",
    ],
    usage:
      "Import generic server helpers from @/lib/editor-collaboration. Install editor-collaboration-worker separately for the Durable Objects adapter. Apply the matching SQL migrations. Supply existing authentication, verified expiry, document policy, CSRF checks, a schema-complete initializer, and runtime adapters. See /docs/editor-collaboration.",
  },
}

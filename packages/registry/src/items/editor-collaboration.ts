import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorCollaborationItem: SourceItem = {
  name: "editor-collaboration",
  title: "Editor collaboration",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Connects native Lexical history, remote cursors, and presence to an authenticated host collaboration service.",
  dependencies: [
    editorDependency("@lexical/yjs"),
    editorDependency("yjs"),
    editorDependency("y-protocols"),
    editorDependency("lib0"),
    editorDependency("zod"),
  ],
  devDependencies: [],
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "box", "list", "form"],
  files: [
    "collaboration.ts",
    "collaboration-client.ts",
    "collaboration-controls.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  docs: {
    api: [
      "createEditorCollaboration",
      "EditorCollaborationProvider",
      "EditorCollaborationExtension",
      "EditorCollaborationRoot",
      "EditorCollaborationStatus",
      "EditorCollaborationAwareness",
      "EditorCollaborationCursors",
      "useEditorCollaboration",
      "EditorCollaborationController",
      "EditorCollaborationClientOptions",
      "EditorCollaborationRootProps",
      "EditorCollaborationSnapshot",
      "EditorCollaborationPeer",
      "EditorCollaborationConnectionStatus",
      "EditorCollaborationWebSocket",
    ],
    usage:
      "Import optional parts from @/components/editor/collaboration. Keep one stable controller and extension array per root. Supply explicit same-origin ticket and secure socket routes. Install editor-collaboration-server separately. See /docs/editor-collaboration.",
  },
}

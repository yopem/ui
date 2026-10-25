import type { SourceItem } from "@registry/items/types"

import { registryDependency } from "@registry/registry-dependencies"

export const editorAiMenuItem: SourceItem = {
  name: "editor-ai-menu",
  title: "Editor AI menu",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Adds configured AI commands, bounded chat, and explicit proposal decisions to EditorRoot.",
  dependencies: [],
  devDependencies: [],
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "editor-review",
    "dialog",
    "field",
    "list",
    "scroll-area",
    "wrap",
  ],
  files: ["ai-menu.tsx", "ai-menu-preview.tsx", "cursor-overlay-store.ts"].map(
    (file) => ({
      path: `components/editor/${file}`,
      type: "registry:ui",
      target: `@/components/editor/${file}`,
    }),
  ),
  docs: {
    api: [
      "EditorAiMenuRoot",
      "EditorAiMenuTrigger",
      "EditorAiMenuContent",
      "EditorAiMenuPanel",
      "EditorAiInlinePreview",
    ],
    usage:
      "Compose these parts inside configured EditorAiRoot and EditorRoot. EditorAiMenuContent owns the editable surface. Supply an explicit host endpoint, document ID, and current authentication and CSRF headers. Approve completed plain text explicitly. Supply optional synchronous markdownInsertion for validated Markdown approval. Install editor-document in the host composition to use $insertDocumentFragment. The callback runs inside the editor update and must return literal true after insertion. Failed insertion keeps the proposal open. MDX remains literal source. Bounded chat stays in memory until the menu root unmounts. Review comments require the current review policy.",
  },
}

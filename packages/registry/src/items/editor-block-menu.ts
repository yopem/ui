import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorBlockMenuItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@lexical/code"),
    editorDependency("@lexical/list"),
    editorDependency("@lexical/rich-text"),
    editorDependency("@lexical/selection"),
  ],
  description:
    "Compose native block actions with host policy and stale-target checks.",
  devDependencies: [],
  docs: {
    api: [
      "createEditorBlockMenu",
      "EditorBlockMenu",
      "EditorBlockMenuActionPreparation",
    ],
    usage:
      "Create one stable controller per root. Register its extension at root creation. Wrap EditorContent with EditorBlockMenu inside that root. Right-click a block or press Shift+F10. Supplied policy must return literal true. Ask AI and Code Drawing require explicit host callbacks and separate authorization. Their second argument retains a validated target after menu close. Call restoreSelection from the native control's onClick handler. Prevent default when restoration fails. Call refresh after policy changes. Dispose retained preparations during cleanup. Missing callbacks hide these actions. Add Comment requires its own callback and a literal-true host policy.",
  },
  files: [
    "block-menu.ts",
    "block-menu-controls.tsx",
    "block-menu-index.ts",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui" as const,
  })),
  name: "editor-block-menu",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "editor-block-selection", "context-menu"],
  title: "Editor Block Menu",
  type: "registry:ui",
}

import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorBlockSelectionItem: SourceItem = {
  name: "editor-block-selection",
  title: "Editor block selection",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Select and safely reorder complete native Lexical top-level blocks.",
  dependencies: [
    editorDependency("@lexical/clipboard"),
    editorDependency("@stylexjs/stylex"),
    editorDependency("lexical"),
    editorDependency("lucide-react"),
    editorDependency("zod"),
  ],
  devDependencies: [],
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "box", "button", "hstack", "wrap"],
  files: [
    "block-selection-index.ts",
    "block-selection.ts",
    "block-selection-controls.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  docs: {
    api: [
      "createEditorBlockSelection",
      "EditorBlockSelection",
      "EditorBlockSelectionGutter",
      "EditorBlockDragHandle",
      "EditorBlockSelectionActions",
      "EditorBlockSelectionAction",
      "EditorBlockSelectionStatus",
      "useEditorBlockSelection",
      "EditorBlockSelectionOptions",
      "EditorBlockSelectionController",
      "EditorBlockSelectionSnapshot",
    ],
    usage:
      "Import parts from @/components/editor/block-selection-index. Create one stable controller for each EditorRoot and register its extension. Wrap the root with EditorBlockSelection. Compose the gutter, actions, and status with EditorContent. Supply a synchronous authorizeCut callback that returns literal true only after host approval. See /docs/editor#optional-block-selection.",
  },
}

import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorEditableCardItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@lexical/utils"),
    editorDependency("zod"),
  ],
  description:
    "Insert a native card with local form controls and an independent nested editor.",
  devDependencies: [],
  docs: {
    api: [
      "EditorEditableCardExtension",
      "EditorEditableCardInsertButton",
      "EditorEditableCardInsertButtonProps",
      "$createEditorEditableCardNode",
      "EditorEditableCardNode",
      "editorEditableCardFromHTMLAttributes",
      "parseEditorEditableCardNode",
      "SerializedEditorEditableCardNode",
    ],
    usage:
      "Register EditorEditableCardExtension in a stable root extensions array. Compose EditorEditableCardInsertButton inside EditorToolbar. The card uses native form controls and a separate nested editor. Local fields and nested notes are transient. Removal, import, and undo restoration reset them. JSON stores only the card type and version. Outer read-only state disables the local controls. Keep native browser Tab order. Generic document conversion does not support cards.",
  },
  files: [
    "editable-card.ts",
    "editable-card-model.ts",
    "editable-card-node.tsx",
    "editable-card-extension.tsx",
    "editable-card-view.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui" as const,
  })),
  name: "editor-editable-card",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "box",
    "button",
    "field",
    "fieldset",
    "figcaption",
    "input",
    "label",
    "radio-group",
    "stack",
    "text",
    "toolbar",
  ],
  title: "Editor editable card",
  type: "registry:ui",
}

import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorColumnsItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("@lexical/utils"),
    editorDependency("@stylexjs/stylex"),
    editorDependency("lexical"),
    editorDependency("zod"),
  ],
  description:
    "Adds native rich-text columns with bounded layouts and resize controls.",
  devDependencies: [],
  docs: {
    api: [
      "EditorColumnsExtension",
      "EditorColumnsControls",
      "EditorColumnsInsertControl",
      "EditorColumnsLayoutControl",
      "EditorColumnResizeControls",
      "EditorColumnMoveControls",
      "EditorColumnsRemoveControl",
      "EditorColumnNode",
      "EditorColumnsGroupNode",
      "parseEditorColumnsLayout",
      "parseEditorColumnsJSON",
      "validateEditorColumnsJSON",
      "validateEditorColumnsHTML",
      "editorColumnsToMarkdown",
      "editorColumnsFromMarkdown",
    ],
    usage:
      "Register EditorColumnsExtension in a stable extensions array. Compose controls inside EditorToolbar. Import pure codecs from @/components/editor/columns-model. Keep two through four columns. Generic editor-document converters do not support columns.",
  },
  files: [
    "dom.ts",
    "columns.ts",
    "columns-model.ts",
    "columns-node.ts",
    "columns-extension.ts",
    "columns-controls.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  name: "editor-columns",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "button", "slider", "toolbar", "wrap"],
  title: "Editor columns",
  type: "registry:ui",
}

import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorBlocksItem: SourceItem = {
  categories: ["input"],
  dependencies: [editorDependency("@lexical/clipboard")],
  description:
    "Adds optional native callouts and disclosures to the Lexical editor.",
  devDependencies: [],
  docs: {
    api: [
      "EditorBlocksExtension",
      "EditorBlocksControls",
      "EditorBlockTypeButton",
      "EditorCalloutButton",
      "EditorToggleButton",
      "EditorCalloutAppearanceButton",
      "EditorCalloutIconControl",
      "EditorRemoveBlockButton",
      "EditorDisclosureButton",
      "CalloutNode",
      "ToggleNode",
      "ToggleSummaryNode",
      "ToggleBodyNode",
      "validateEditorBlocksJSON",
      "validateEditorBlocksHTML",
    ],
    usage:
      "Import EditorBlocksExtension from @/components/editor/blocks. Register it in a stable extensions array. Compose focused controls inside EditorToolbar. Import server-safe models from @/components/editor/blocks-model. See /docs/editor.",
  },
  files: [
    "blocks.ts",
    "blocks-model.ts",
    "blocks-clipboard.ts",
    "blocks-extension.ts",
    "blocks-controls.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  name: "editor-blocks",
  peerDependencies: ["react@>=19 <20", "react-dom@>=19 <20"],
  registryDependencies: ["editor"],
  title: "Editor blocks",
  type: "registry:ui",
}

import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorLabelsItem: SourceItem = {
  categories: ["input"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("zod"),
    editorDependency("@stylexjs/stylex"),
  ],
  description:
    "Compose validated native label tokens and house checkbox options.",
  devDependencies: [],
  docs: {
    api: [
      "EditorLabelsPicker",
      "EditorLabelsPickerProps",
      "EditorLabelsOption",
      "EditorLabelsOptionProps",
      "EditorLabelNode",
      "createEditorLabelsExtension",
      "$getEditorLabels",
      "$replaceEditorLabels",
      "decodeEditorLabels",
      "decodeEditorLabelNode",
      "parseEditorLabelOptions",
      "editorLabelSchema",
      "editorLabelNodeSchema",
      "EDITOR_LABEL_MAX_COUNT",
      "EDITOR_LABEL_MAX_LENGTH",
      "EDITOR_LABEL_MAX_OPTIONS",
    ],
    usage:
      "Create a stable createEditorLabelsExtension(options) per root. Admit one through 64 unique bounded options. Replace only a label-only native paragraph with $replaceEditorLabels inside editor.update. Validate application minimum counts separately. EditorLabelsPicker composes house CheckboxGroup and EditorLabelsOption. Compose options directly inside CheckboxGroup for custom labels. Register EditorLabelNode in every reader. Import pure validation from labels-model and native nodes from labels-node. Invalid token metadata rejects; unknown, duplicate, and excess valid tokens become ordinary text. Label identities grant no access. Generic document conversion does not support label tokens.",
  },
  files: [
    "labels.ts",
    "labels-model.ts",
    "labels-node.ts",
    "labels-extension.ts",
    "labels-controls.tsx",
  ].map((name) => ({
    path: `components/editor/${name}`,
    target: `@/components/editor/${name}`,
    type: "registry:ui" as const,
  })),
  name: "editor-labels",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "checkbox",
    "checkbox-group",
    "label",
    "fieldset",
    "form",
    "hstack",
  ],
  title: "Editor labels",
  type: "registry:ui",
}

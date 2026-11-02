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
    "Select validated native labels with filtered chips or house checkbox options.",
  devDependencies: [],
  docs: {
    api: [
      "EditorLabelsSelect",
      "EditorLabelsSelectProps",
      "EditorLabelsChangeEventDetails",
      "EditorLabelsInput",
      "EditorLabelsInputProps",
      "EditorLabelsContent",
      "EditorLabelsContentProps",
      "EditorLabelsTag",
      "EditorLabelsTagProps",
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
      "Create a stable createEditorLabelsExtension(options) per root. Admit one through 64 unique bounded options. Mount EditorLabelsSelect inside EditorRoot beside EditorContent. The preset composes EditorLabelsInput, EditorLabelsTag, and EditorLabelsContent with house Combobox multiple selection. Search filters options without changing the document. Select or remove up to ten labels with pointer or keyboard input. Without value, valid changes update the native label-only paragraph with one history step. onValueChange can cancel through details.cancel(). With value, the host must commit through $replaceEditorLabels inside editor.update and mirror native history through EditorRoot onChange. Pass SKIP_DOM_SELECTION_TAG to host commits to retain search focus. Invalid values disable selection. Render custom tags inside EditorLabelsInput in selected-value order. Keep every selected tag. Read-only roots prevent mutation. Apply name and form to EditorLabelsSelect for native form values. Validate application minimum counts separately. EditorLabelsPicker remains the CheckboxGroup alternative. Register EditorLabelNode in every reader. Import pure validation from labels-model and native nodes from labels-node. Invalid token metadata rejects; unknown, duplicate, and excess valid tokens become ordinary text. Document readers retain validated label tokens. Label identities grant no access. These parts do not implement Slate or Plate APIs.",
  },
  files: [
    "labels.ts",
    "labels-model.ts",
    "labels-node.ts",
    "labels-extension.ts",
    "labels-controls.tsx",
    "labels-select.tsx",
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
    "combobox",
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

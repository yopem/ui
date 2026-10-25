import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorListPresentationItem: SourceItem = {
  categories: ["typography"],
  dependencies: [
    editorDependency("lexical"),
    editorDependency("@lexical/list"),
    editorDependency("zod"),
  ],
  description: "Set native list markers and ordered list starts.",
  devDependencies: [],
  docs: {
    api: [
      "EditorListPresentationExtension",
      "EditorListMarkerControl",
      "EditorListMarkerControlProps",
      "EditorListStartControl",
      "EditorListStartControlProps",
      "EditorListPresentationControls",
      "EditorListPresentationControlsProps",
      "EditorListMarker",
      "createEditorListPresentationHTMLConfig",
      "EDITOR_LIST_MARKER_ATTRIBUTE",
      "EDITOR_LIST_START_MAX",
      "EDITOR_LIST_START_MIN",
      "editorListMarkerSchema",
      "isEditorListMarkerForType",
      "isEditorListStart",
      "parseEditorListStartHTML",
    ],
    usage:
      "Register EditorListPresentationExtension in a stable root extensions array. Compose EditorListMarkerControl, EditorListStartControl, or EditorListPresentationControls inside EditorToolbar. Markers apply to one native list, not its nested lists. Starts accept signed 32-bit integers, including zero. Invalid drafts do not change the document. Saved targets expire after document changes. Native list conversion clears incompatible markers. JSON stores yopemListMarker NodeState. HTML retains data-editor-list-marker and the native ol start attribute. Compose existing HTML hooks with createEditorListPresentationHTMLConfig. Read-only roots cannot change lists.",
  },
  files: [
    "list-presentation.tsx",
    "list-presentation-model.ts",
    "list-presentation-controls.tsx",
    "list-presentation-extension.ts",
  ].map((name) => ({
    path: `components/editor/${name}`,
    target: `@/components/editor/${name}`,
    type: "registry:ui" as const,
  })),
  name: "editor-list-presentation",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: [
    "editor",
    "field",
    "fieldset",
    "input",
    "native-select",
    "wrap",
  ],
  title: "Editor list presentation",
  type: "registry:ui",
}

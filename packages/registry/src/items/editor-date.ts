import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"
import { registryDependency } from "@registry/registry-dependencies"

export const editorDateItem: SourceItem = {
  categories: ["input"],
  dependencies: [editorDependency("lexical"), editorDependency("zod")],
  description: "Adds timezone-safe inline calendar dates to the native editor.",
  devDependencies: [],
  docs: {
    api: [
      "EditorDateExtension",
      "EditorDateControls",
      "EditorDateInsertControl",
      "EditorDateInline",
      "EditorDateNode",
      "EditorDateValue",
      "parseEditorDate",
      "parseEditorDateJSON",
      "validateEditorDateJSON",
      "validateEditorDateHTML",
      "editorDateToCalendarDate",
      "editorDateFromCalendarDate",
      "editorDateFromLocalDate",
      "editorDateToMarkdown",
      "editorDateFromMarkdown",
    ],
    usage:
      "Register EditorDateExtension in a stable extensions array. Compose EditorDateControls inside EditorToolbar. Store YYYY-MM-DD dates without timezone conversion. Import pure codecs from @/components/editor/date-model. Generic editor-document converters do not support dates.",
  },
  files: [
    "dom.ts",
    "date.ts",
    "date-model.ts",
    "date-node.tsx",
    "date-extension.ts",
    "date-controls.tsx",
  ].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  name: "editor-date",
  peerDependencies: [
    registryDependency("react"),
    registryDependency("react-dom"),
  ],
  registryDependencies: ["editor", "button", "calendar", "popover"],
  title: "Editor date",
  type: "registry:ui",
}

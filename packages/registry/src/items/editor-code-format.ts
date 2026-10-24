import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorCodeFormatItem: SourceItem = {
  name: "editor-code-format",
  title: "Editor code formatter",
  type: "registry:lib",
  categories: ["input"],
  description:
    "Adds an optional Prettier adapter for native editor code controls.",
  dependencies: [editorDependency("prettier")],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor-code"],
  files: [
    {
      path: "components/editor/code-format.ts",
      target: "@/components/editor/code-format.ts",
      type: "registry:lib",
    },
  ],
  docs: {
    api: [
      "prettierEditorCodeFormatter",
      "formatEditorCode",
      "getEditorCodeParser",
    ],
    usage:
      "Import prettierEditorCodeFormatter from @/components/editor/code-format. Pass it to EditorCode or EditorCodeFormatButton through the formatter prop. Supported parsers are a subset of the syntax language inventory. Cancellation discards results but cannot stop synchronous parsing. This adapter does not change repository formatting tools.",
  },
}

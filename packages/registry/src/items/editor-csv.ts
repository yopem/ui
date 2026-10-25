import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorCsvItem: SourceItem = {
  name: "editor-csv",
  title: "Editor CSV paste",
  type: "registry:ui",
  categories: ["input"],
  description:
    "Imports bounded comma-separated clipboard data into native editable tables.",
  dependencies: [
    editorDependency("@lexical/table"),
    editorDependency("@lexical/utils"),
  ],
  devDependencies: [],
  peerDependencies: [],
  registryDependencies: ["editor"],
  files: ["csv.ts", "csv-model.ts", "csv-extension.ts"].map((file) => ({
    path: `components/editor/${file}`,
    target: `@/components/editor/${file}`,
    type: "registry:ui",
  })),
  docs: {
    api: [
      "EditorCsvExtension",
      "registerEditorCsvPaste",
      "parseEditorCsv",
      "EditorCsvParseResult",
      "EditorCsvFailure",
      "EditorCsvPasteOutcome",
      "EDITOR_CSV_PASTE_RESULT_COMMAND",
    ],
    usage:
      "Register EditorCsvExtension in a stable root extension array. Use parseEditorCsv from the copied csv-model module for pure parsing. CSV supports quoted commas, escaped quotes, and multiline fields. Input is limited to 1 MiB, 50 rows, 50 columns, and 2500 cells. Rows must have the same width. Plain-text detection requires a comma and multiple lines. Explicit text/csv also supports one row. Native Lexical JSON and HTML keep priority. HIGH and CRITICAL host paste handlers keep control. Configure EditorTablePresentationExtension with pasteTsv:false when CSV owns tab-containing input. Invalid imports keep current content. Native cell line breaks use LF.",
  },
}

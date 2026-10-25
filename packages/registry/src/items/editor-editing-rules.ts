import type { SourceItem } from "@registry/items/types"

import { editorDependency } from "@registry/editor-dependencies"

export const editorEditingRulesItem: SourceItem = {
  categories: ["input"],
  dependencies: [editorDependency("lexical")],
  description:
    "Add native exit-break shortcuts and conditional single-paragraph editing modes.",
  devDependencies: [],
  docs: {
    api: [
      "createEditorEditingRulesExtension",
      "EditorEditingRulesOptions",
      "EditorSingleBlockMode",
      "EditorExitBreakDirection",
      "EditorExitBreakKeyEvent",
      "getEditorExitBreakDirection",
      "INSERT_EDITOR_EXIT_BREAK_COMMAND",
      "INSERT_EDITOR_SINGLE_BLOCK_TEXT_COMMAND",
      "SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND",
      "EDITOR_EDITING_RULE_TEXT_LIMIT",
      "EDITOR_EDITING_RULE_LINE_LIMIT",
    ],
    usage:
      "Create one stable editing-rules extension per root. Mod+Enter inserts after the containing root block; add Shift to insert before it. Single-paragraph modes retain one paragraph for Enter and modifier shortcuts. Other root shapes keep native editing. This extension does not validate complete documents.",
  },
  files: [
    {
      path: "components/editor/editing-rules.ts",
      target: "@/components/editor/editing-rules.ts",
      type: "registry:ui",
    },
  ],
  name: "editor-editing-rules",
  peerDependencies: [],
  registryDependencies: ["editor", "hstack"],
  title: "Editor editing rules",
  type: "registry:ui",
}

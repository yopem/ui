import type { LexicalEditor } from "lexical"

import {
  COMMAND_PRIORITY_EDITOR,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
} from "lexical"

export function registerEditorClipboardGuard(editor: LexicalEditor) {
  return editor.registerCommand(
    SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
    ({ nodes }) => nodes.length === 0,
    COMMAND_PRIORITY_EDITOR,
  )
}

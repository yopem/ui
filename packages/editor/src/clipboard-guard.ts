import type { ImportMimeTypeFunction } from "@lexical/clipboard"
import type { LexicalEditor } from "lexical"

import {
  COMMAND_PRIORITY_EDITOR,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
} from "lexical"

import { scanDocumentJSON } from "./json-duplicates"

export const $guardEditorNativeJSON: ImportMimeTypeFunction = (
  data,
  _selection,
  next,
) => {
  let value: unknown

  try {
    value = JSON.parse(data)
  } catch {
    return next()
  }

  if (
    value instanceof Object &&
    !Array.isArray(value) &&
    Object.hasOwn(value, "namespace") &&
    Object.hasOwn(value, "nodes") &&
    scanDocumentJSON(data, data.length) === "duplicate"
  )
    return true

  return next()
}

export function registerEditorClipboardGuard(editor: LexicalEditor) {
  return editor.registerCommand(
    SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
    ({ nodes }) => nodes.length === 0,
    COMMAND_PRIORITY_EDITOR,
  )
}

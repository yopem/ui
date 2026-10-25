import {
  $createTableNodeWithDimensions,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  TableExtension,
  type TableNode,
} from "@lexical/table"
import { $findMatchingParent } from "@lexical/utils"
import {
  $addUpdateTag,
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  defineExtension,
  HISTORY_PUSH_TAG,
  PASTE_COMMAND,
  PASTE_TAG,
  type LexicalEditor,
  type LexicalNode,
} from "lexical"

import { parseEditorCsv, type EditorCsvFailure } from "./csv-model"

export type EditorCsvPasteOutcome =
  | { readonly ok: true; readonly rows: number; readonly columns: number }
  | { readonly ok: false; readonly reason: EditorCsvFailure | "selection" }

export const EDITOR_CSV_PASTE_RESULT_COMMAND =
  createCommand<EditorCsvPasteOutcome>("EDITOR_CSV_PASTE_RESULT")

function $nearestTable(node: LexicalNode) {
  const parent = $findMatchingParent(node, $isTableNode)

  return $isTableNode(parent) ? parent : null
}

export function registerEditorCsvPaste(editor: LexicalEditor) {
  return editor.registerCommand(
    PASTE_COMMAND,
    (event) => {
      if (
        !editor.isEditable() ||
        !event ||
        !("clipboardData" in event) ||
        !event.clipboardData
      )
        return false

      if (event.defaultPrevented) return true
      const clipboard = event.clipboardData

      if (
        clipboard.getData("application/x-lexical-editor") ||
        clipboard.getData("text/html")
      )
        return false
      const explicit = clipboard.getData("text/csv")
      const text = explicit || clipboard.getData("text/plain")

      if (!explicit && (!text.includes(",") || !/[\r\n]/.test(text)))
        return false
      const result = parseEditorCsv(text)
      event.preventDefault()

      if (!result.ok) {
        editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, result)

        return true
      }

      const selection = $getSelection()

      if (!selection) {
        editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, {
          ok: false,
          reason: "selection",
        })

        return true
      }

      let containingTable: TableNode | null = null

      if ($isTableSelection(selection)) {
        const selected = $getNodeByKey(selection.tableKey)

        if (!$isTableNode(selected)) {
          editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, {
            ok: false,
            reason: "selection",
          })

          return true
        }

        containingTable = selected
      } else if ($isRangeSelection(selection)) {
        const anchorTable = $nearestTable(selection.anchor.getNode())
        const focusTable = $nearestTable(selection.focus.getNode())

        if (anchorTable !== focusTable) {
          editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, {
            ok: false,
            reason: "selection",
          })

          return true
        }

        containingTable = anchorTable
      }

      const first = result.rows.at(0)

      if (!first) {
        editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, {
          ok: false,
          reason: "empty",
        })

        return true
      }

      const table = $createTableNodeWithDimensions(
        result.rows.length,
        first.length,
        false,
      )

      for (const [rowIndex, values] of result.rows.entries()) {
        const row = table.getChildAtIndex(rowIndex)

        if (!$isTableRowNode(row)) {
          editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, {
            ok: false,
            reason: "shape",
          })

          return true
        }

        for (const [columnIndex, text] of values.entries()) {
          const cell = row.getChildAtIndex(columnIndex)

          if (!$isTableCellNode(cell)) {
            editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, {
              ok: false,
              reason: "shape",
            })

            return true
          }

          const paragraph = $createParagraphNode()

          for (const [index, part] of text
            .replace(/\r\n?/g, "\n")
            .split("\n")
            .entries()) {
            if (index > 0) paragraph.append($createLineBreakNode())

            if (part) paragraph.append($createTextNode(part))
          }

          cell.clear().append(paragraph)
        }
      }

      $addUpdateTag(PASTE_TAG)
      $addUpdateTag(HISTORY_PUSH_TAG)

      if (containingTable) containingTable.insertAfter(table)
      else $insertNodes([table])
      table.selectStart()
      editor.dispatchCommand(EDITOR_CSV_PASTE_RESULT_COMMAND, {
        ok: true,
        rows: result.rows.length,
        columns: first.length,
      })

      return true
    },
    COMMAND_PRIORITY_LOW,
  )
}

export const EditorCsvExtension = defineExtension({
  name: "@yopem-ui/editor/csv",
  dependencies: [TableExtension],
  register: registerEditorCsvPaste,
})

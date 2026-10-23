import {
  $getTableCellNodeFromLexicalNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  type TableSelection,
} from "@lexical/table"
import {
  $getEditor,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  isCurrentlyReadOnlyMode,
  type LexicalEditor,
  type RangeSelection,
} from "lexical"

import { $isValidBookmarkPoint } from "./selection-bookmark"

export function $getTableContext(selection = $getSelection()) {
  if (!$isRangeSelection(selection) && !$isTableSelection(selection))
    return null

  if (![selection.anchor, selection.focus].every($isValidBookmarkPoint))
    return null

  const anchor = selection.anchor.getNode()
  const focus = selection.focus.getNode()
  const cell = $getTableCellNodeFromLexicalNode(anchor)
  const focusCell = $getTableCellNodeFromLexicalNode(focus)

  if (!cell || !focusCell) return null
  const row = cell.getParent()
  const focusRow = focusCell.getParent()

  if (!$isTableRowNode(row) || !$isTableRowNode(focusRow)) return null
  const table = row.getParent()

  if (!$isTableNode(table) || !table.is(focusRow.getParent())) return null

  if ($isTableSelection(selection)) {
    if (
      selection.tableKey !== table.getKey() ||
      !anchor.is(cell) ||
      !focus.is(focusCell) ||
      selection.anchor.type !== "element" ||
      selection.focus.type !== "element" ||
      selection.anchor.offset !== 0 ||
      selection.focus.offset !== 0
    )
      return null
  } else if (!cell.is(focusCell)) return null

  const cells = $isTableSelection(selection)
    ? selection.getNodes().filter($isTableCellNode)
    : [cell]

  return { cell, table, cells }
}

export function createEditorTableBookmark(editor: LexicalEditor) {
  let saved: RangeSelection | TableSelection | null = null
  let tableKey: string | null = null
  let unregister: (() => void) | undefined
  const listeners = new Set<() => void>()

  function clear() {
    if (!saved) return
    saved = null
    tableKey = null

    for (const listener of listeners) listener()
  }

  function capture() {
    const selection = $getSelection()

    const context =
      unregister && editor.isEditable() ? $getTableContext(selection) : null

    if (
      !context ||
      (!$isRangeSelection(selection) && !$isTableSelection(selection))
    ) {
      clear()

      return
    }

    const hadSelection = saved !== null
    saved = selection.clone()
    tableKey = context.table.getKey()

    if (!hadSelection) {
      for (const listener of listeners) listener()
    }
  }

  function restore() {
    if (isCurrentlyReadOnlyMode()) return false

    if ($getEditor() !== editor) return false

    if (!saved || !unregister || !editor.isEditable()) {
      clear()

      return false
    }

    const context = $getTableContext(saved)

    if (!context || context.table.getKey() !== tableKey) {
      clear()

      return false
    }

    $setSelection(saved.clone())

    return true
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)

    if (!unregister) {
      const stopUpdates = editor.registerUpdateListener(
        ({ dirtyElements, dirtyLeaves }) => {
          if (dirtyElements.size > 0 || dirtyLeaves.size > 0) clear()
        },
      )

      const stopEditable = editor.registerEditableListener(clear)
      unregister = () => {
        stopUpdates()
        stopEditable()
      }
    }

    return function unsubscribe() {
      listeners.delete(listener)

      if (listeners.size === 0) {
        unregister?.()
        unregister = undefined
        clear()
      }
    }
  }

  function getSnapshot() {
    return saved !== null
  }

  function getServerSnapshot(): false {
    return false
  }

  return { capture, clear, restore, subscribe, getSnapshot, getServerSnapshot }
}

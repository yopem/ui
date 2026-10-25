import {
  $mergeTableCellsWithBorders,
  $unmergeTableCellWithBorders,
  EditorTablePresentationExtension,
  isTableMergeDisabled,
} from "@editor/table-presentation"
import { buildEditorFromExtensions } from "@lexical/extension"
import {
  $createTableNodeWithDimensions,
  $createTableSelection,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
} from "@lexical/table"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSelection,
  configExtension,
} from "lexical"

function createTableEditor(disableMerge?: boolean) {
  const extension =
    disableMerge === undefined
      ? EditorTablePresentationExtension
      : configExtension(EditorTablePresentationExtension, { disableMerge })

  const editor = buildEditorFromExtensions(extension)

  editor.update(
    () => {
      $getRoot().append($createTableNodeWithDimensions(2, 2, false))
    },
    { discrete: true },
  )

  return editor
}

function getTable() {
  const node = $getRoot().getFirstChildOrThrow()

  if (!$isTableNode(node)) throw new Error("Expected a table")

  const cells = node.getChildren().flatMap((row) => {
    if (!$isTableRowNode(row)) throw new Error("Expected a table row")

    return row.getChildren().map((cell) => {
      if (!$isTableCellNode(cell)) throw new Error("Expected a table cell")

      return cell
    })
  })

  return { table: node, cells }
}

test("merge policy defaults to enabled and stays isolated per editor", () => {
  const restricted = createTableEditor(true)
  const unrestricted = createTableEditor()

  expect(isTableMergeDisabled(restricted)).toBe(true)
  expect(isTableMergeDisabled(unrestricted)).toBe(false)

  restricted.update(
    () => {
      const { table, cells } = getTable()
      expect($mergeTableCellsWithBorders(table, cells)).toBeNull()
    },
    { discrete: true },
  )
  unrestricted.update(
    () => {
      const { table, cells } = getTable()
      const merged = $mergeTableCellsWithBorders(table, cells)
      expect(merged?.getColSpan()).toBe(2)
      expect(merged?.getRowSpan()).toBe(2)
    },
    { discrete: true },
  )
  expect(restricted.getEditorState().read(() => getTable().cells.length)).toBe(
    4,
  )

  restricted.dispose()
  unrestricted.dispose()
})

test("disposing a configured editor cleans up its merge policy", () => {
  const editor = createTableEditor(true)

  expect(isTableMergeDisabled(editor)).toBe(true)
  editor.dispose()
  expect(isTableMergeDisabled(editor)).toBe(false)
})

test("pre-existing spans stay intact and only split through an explicit action", () => {
  const editor = createTableEditor(true)

  editor.update(
    () => {
      const { table, cells } = getTable()
      const merged = cells[0]
      const removed = cells[1]

      if (!merged || !removed) throw new Error("Expected table cells")
      const text = $createTextNode("Imported span")
      merged.setColSpan(2)
      removed.remove()
      merged.clear().append($createParagraphNode().append(text))
      text.setTextContent("Edited imported span")
      expect($mergeTableCellsWithBorders(table, cells.slice(2))).toBeNull()
    },
    { discrete: true },
  )

  expect(
    editor.getEditorState().read(() => {
      const { cells } = getTable()

      return {
        count: cells.length,
        colSpan: cells[0]?.getColSpan(),
        text: cells[0]?.getTextContent(),
      }
    }),
  ).toEqual({ count: 3, colSpan: 2, text: "Edited imported span" })

  editor.update(
    () => {
      const { table, cells } = getTable()
      const merged = cells[0]

      if (!merged) throw new Error("Expected imported span")
      const selection = $createTableSelection()
      selection.set(table.getKey(), merged.getKey(), merged.getKey())
      $setSelection(selection)
      $unmergeTableCellWithBorders()
    },
    { discrete: true },
  )

  expect(
    editor.getEditorState().read(() => {
      const { cells } = getTable()

      return {
        count: cells.length,
        colSpans: cells.map((cell) => cell.getColSpan()),
      }
    }),
  ).toEqual({ count: 4, colSpans: [1, 1, 1, 1] })
  editor.dispose()
})

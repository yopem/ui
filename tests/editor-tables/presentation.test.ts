import {
  registerTablePresentationValidation,
  clampTableColumnWidth,
  createEditorTablePresentationHTMLConfig,
} from "@editor/table-presentation"
import { parseTablePresentationJSON } from "@editor/table-presentation-schema"
import {
  $createTableNodeWithDimensions,
  TableNode,
  TableRowNode,
  TableCellNode,
} from "@lexical/table"
import { expect, test } from "bun:test"
import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from "lexical"

import { document, table } from "./fixtures"

test("runtime rejection preserves prior rich document headlessly", () => {
  const errors: Error[] = []

  const editor = createEditor({
    nodes: [TableNode, TableRowNode, TableCellNode],
    onError(error) {
      errors.push(error)
    },
  })

  registerTablePresentationValidation(editor)
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append(
          $createTextNode("Keep").toggleFormat("bold"),
        ),
      )
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()

  for (const dimensions of [
    [51, 1],
    [1, 51],
  ]) {
    editor.update(
      () => {
        $getRoot().append(
          $createTableNodeWithDimensions(dimensions[0], dimensions[1], false),
        )
      },
      { discrete: true },
    )
    expect(editor.getEditorState().toJSON()).toEqual(before)
  }

  editor.update(
    () => {
      const outer = $createTableNodeWithDimensions(1, 1, false)
      outer
        .getFirstDescendant()
        ?.getParent()
        ?.append($createTableNodeWithDimensions(1, 1, false))
      $getRoot().append(outer)
    },
    { discrete: true },
  )
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(errors.length).toBe(3)
  expect(() =>
    parseTablePresentationJSON(JSON.stringify(document(table(1, 51)))),
  ).toThrow()
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("native converters initialize without browser globals", () => {
  const before = globalThis.document
  const config = createEditorTablePresentationHTMLConfig()
  expect(config.import?.table).toBeFunction()
  expect(config.import?.tr).toBeFunction()
  expect(config.import?.td).toBeFunction()
  expect(config.import?.th).toBeFunction()
  expect(config.export?.has(TableNode)).toBe(true)
  expect(globalThis.document).toBe(before)
})

test("width clamping handles bounds and nonfinite values", () => {
  expect([-5, 48, 640, 700, NaN, Infinity].map(clampTableColumnWidth)).toEqual([
    48, 48, 640, 640, 120, 120,
  ])
})

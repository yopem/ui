import {
  $setTableBorders,
  tableCellBorderState,
} from "@editor/table-presentation"
import {
  tableBorderSchema,
  parseTablePresentationJSON,
  tablePresentationDocumentSchema,
  validateTableGeometry,
  getTableSpanGeometry,
  parseTableRowHeightHTML,
} from "@editor/table-presentation-schema"
import {
  $createTableNodeWithDimensions,
  TableNode,
  TableRowNode,
  TableCellNode,
  $isTableRowNode,
  $isTableCellNode,
} from "@lexical/table"
import { describe, expect, test } from "bun:test"
import {
  createEditor,
  $getRoot,
  $getState,
  $setState,
  createState,
} from "lexical"
import { z } from "zod"

function document(
  border: string | null | Record<string, string | number | null>,
  height: number | string = 80,
) {
  return {
    root: {
      type: "root",
      children: [
        {
          type: "table",
          children: [
            {
              type: "tablerow",
              height,
              children: [
                {
                  type: "tablecell",
                  $: { yopemTableBorder: border, host: { keep: true } },
                },
              ],
            },
          ],
        },
      ],
    },
  }
}

describe("portable table edge and row contracts", () => {
  test("accepts legacy and edge state without rewriting unrelated metadata", () => {
    for (const border of [
      null,
      "solid",
      "hidden",
      { top: "solid", bottom: "hidden", start: null, end: "solid" },
    ]) {
      const input = JSON.stringify(document(border))
      expect(parseTablePresentationJSON(input)).toBe(input)
    }

    expect(
      tablePresentationDocumentSchema.safeParse(document(null, 25000)).success,
    ).toBe(true)
  })
  test("rejects malformed or oversized edges and nonfinite row metadata", () => {
    for (const value of [
      "dashed",
      {},
      { top: "solid", left: "hidden" },
      { top: "solid", bottom: "hidden", start: null, end: "solid", extra: 1 },
      "x".repeat(10000),
    ])
      expect(tableBorderSchema.safeParse(value).success).toBe(false)
    expect(
      tablePresentationDocumentSchema.safeParse(document(null, "80px")).success,
    ).toBe(false)
    expect(
      tablePresentationDocumentSchema.safeParse(document(null, Infinity))
        .success,
    ).toBe(false)
  })
  test("canonical geometry exposes merged placements and rejects holes", () => {
    const geometry = getTableSpanGeometry([
      [{ rowSpan: 2 }, {}, {}],
      [{}, {}],
    ])

    expect(
      geometry.placements.map((p) => [p.row, p.column, p.rowSpan, p.colSpan]),
    ).toEqual([
      [0, 0, 2, 1],
      [0, 1, 1, 1],
      [0, 2, 1, 1],
      [1, 1, 1, 1],
      [1, 2, 1, 1],
    ])
    expect(() => validateTableGeometry([[{}, {}], [{}]])).toThrow()
  })
})

test("native model applies rectangle borders, mirrors neighbors, preserves NodeState and native heights", () => {
  const editor = createEditor({
    namespace: "edges-rows",
    nodes: [TableNode, TableRowNode, TableCellNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const table = $createTableNodeWithDimensions(2, 2, false)
      $getRoot().append(table)
      const rows = table.getChildren().filter($isTableRowNode)

      const cells = rows.flatMap((row) =>
        row.getChildren().filter($isTableCellNode),
      )

      const first = cells[0]

      const host = createState("host", {
        parse: (value) => z.string().catch("").parse(value),
      })

      $setState(first, host, "keep")
      $setTableBorders(table, [first], "none")
      expect($getState(first, tableCellBorderState)).toEqual({
        top: "hidden",
        bottom: "hidden",
        start: "hidden",
        end: "hidden",
      })
      expect($getState(cells[1], tableCellBorderState)).toMatchObject({
        start: "hidden",
      })
      $setTableBorders(table, [first], "end")
      expect($getState(cells[1], tableCellBorderState)).toMatchObject({
        start: "solid",
      })
      expect($getState(first, host)).toBe("keep")
      $setTableBorders(table, cells, "outside")
      expect($getState(first, tableCellBorderState)).toMatchObject({
        top: "solid",
        start: "solid",
      })
      $setTableBorders(table, cells, "inside")
      expect($getState(first, tableCellBorderState)).toMatchObject({
        end: "solid",
        bottom: "solid",
      })
      $setTableBorders(table, cells, "reset")
      expect($getState(first, tableCellBorderState)).toBeNull()
      rows[0].setHeight(123)
      expect(rows[0].exportJSON().height).toBe(123)
      expect(() => $setTableBorders(table, [], "all")).not.toThrow()
    },
    { discrete: true },
  )
  const state = editor.getEditorState().toJSON()
  expect(() => editor.parseEditorState(JSON.stringify(state))).not.toThrow()
})

test("row HTML metadata retains finite native heights and rejects malformed attributes", () => {
  for (const height of [
    0,
    Number.MIN_VALUE,
    -Number.MIN_VALUE,
    900,
    Number.MAX_VALUE,
    -Number.MAX_VALUE,
  ]) {
    expect(parseTableRowHeightHTML(String(height))).toBe(height)
  }

  expect(parseTableRowHeightHTML(null)).toBeUndefined()

  for (const value of [
    "",
    " ",
    "NaN",
    "Infinity",
    "-Infinity",
    "1e309",
    "0x10",
    "80px",
    "1; color:red",
    "0".repeat(33),
  ]) {
    expect(parseTableRowHeightHTML(value)).toBeUndefined()
  }
})

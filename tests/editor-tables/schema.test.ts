import {
  parseTablePresentationJSON,
  tablePresentationDocumentSchema,
  validateTableGeometry,
  TABLE_MAX_COLUMNS,
  TABLE_MAX_CELLS,
} from "@editor/table-presentation-schema"
import { describe, expect, test } from "bun:test"

import type { TestNode } from "./fixtures"

import { cell, document, table } from "./fixtures"

function valid(value: ReturnType<typeof document>) {
  return tablePresentationDocumentSchema.safeParse(value).success
}

describe("portable table geometry", () => {
  test("canonical maximum and covered spans", () => {
    expect(TABLE_MAX_COLUMNS).toBe(50)
    expect(TABLE_MAX_CELLS).toBe(2500)
    expect(valid(document(table(50, 50)))).toBe(true)
    expect(validateTableGeometry([[{ colSpan: 2, rowSpan: 2 }], []])).toEqual({
      rows: 2,
      columns: 2,
      cells: 4,
    })
    expect(validateTableGeometry([[{ rowSpan: 2 }, {}], [{}]])).toEqual({
      rows: 2,
      columns: 2,
      cells: 4,
    })
  })
  test("document budget and dimensions", () => {
    expect(valid(document(table(50, 50), table(1, 1)))).toBe(false)
    expect(valid(document(table(51, 1)))).toBe(false)
    expect(valid(document(table(1, 51)))).toBe(false)
    expect(valid(document(table(25, 50), table(25, 50)))).toBe(true)
  })
  test("holes overlaps bounds and empty geometry", () => {
    for (const rows of [
      [],
      [[]],
      [[{}, {}], [{}]],
      [[{ rowSpan: 3 }], []],
      [[{}, { rowSpan: 2 }], [{ colSpan: 2 }]],
    ])
      expect(() => validateTableGeometry(rows)).toThrow()
  })
  test("rejects invalid spans without coercion", () => {
    for (const value of [0, -1, 1.5, NaN, Infinity, 51]) {
      expect(() => validateTableGeometry([[{ colSpan: value }]])).toThrow()
      expect(() => validateTableGeometry([[{ rowSpan: value }]])).toThrow()
    }
  })
  test("nesting orphans depth and input budgets", () => {
    const nested = {
      type: "table",
      children: [
        {
          type: "tablerow",
          children: [{ ...cell(), children: [table(1, 1)] }],
        },
      ],
    }

    expect(valid(document(nested))).toBe(false)
    expect(valid(document({ type: "tablerow", children: [] }))).toBe(false)
    expect(valid(document(cell()))).toBe(false)
    let deep: TestNode = { type: "text" }

    for (let index = 0; index < 66; index += 1)
      deep = { type: "paragraph", children: [deep] }
    expect(valid(document(deep))).toBe(false)
    expect(() => parseTablePresentationJSON(" ".repeat(1_048_577))).toThrow()
  })
  test("presentation values reject rather than normalize", () => {
    for (const attributes of [
      { width: 47 },
      { width: 641 },
      { width: NaN },
      { backgroundColor: "rgb(999,0,0)" },
      { $: { yopemTableBorder: "bad" } },
    ]) {
      const value = {
        type: "table",
        children: [
          { type: "tablerow", children: [{ ...cell(), ...attributes }] },
        ],
      }

      expect(valid(document(value))).toBe(false)
    }

    expect(
      valid(
        document({
          type: "table",
          colWidths: [48],
          children: [
            {
              type: "tablerow",
              children: [
                {
                  ...cell(),
                  width: 640,
                  backgroundColor: "rgb(255, 0, 0)",
                  $: { yopemTableBorder: null },
                },
              ],
            },
          ],
        }),
      ),
    ).toBe(true)
  })
})

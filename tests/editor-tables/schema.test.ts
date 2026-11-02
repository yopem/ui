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
  test("slot edges preserve table ancestry and share document budgets", () => {
    const paragraph = { type: "paragraph", children: [] }

    function slotted<T extends TestNode>(value: T) {
      return { ...paragraph, $slots: { note: value } }
    }

    const nested = {
      type: "table",
      children: [
        {
          type: "tablerow",
          children: [{ ...cell(), children: [slotted(table(1, 1))] }],
        },
      ],
    }

    expect(valid(document(slotted(table(1, 1))))).toBe(true)
    expect(valid(document(slotted({ type: "tablerow", children: [] })))).toBe(
      false,
    )
    expect(valid(document(slotted(cell())))).toBe(false)
    expect(valid(document(nested))).toBe(false)
    expect(valid(document(table(50, 50), slotted(table(1, 1))))).toBe(false)
    expect(
      valid(document(slotted({ ...table(1, 1), colWidths: [48, 48] }))),
    ).toBe(false)
    expect(
      valid(document(slotted({ ...table(1, 1), $slots: { row: cell() } }))),
    ).toBe(false)
    expect(valid(document({ ...paragraph, $slots: { note: null } }))).toBe(
      false,
    )
    expect(valid(document({ ...paragraph, $slots: [] }))).toBe(false)

    let deep: TestNode = table(1, 1)

    for (let index = 0; index < 65; index += 1) deep = slotted(deep)
    expect(valid(document(slotted(deep)))).toBe(false)
  })
  test("table slots retain ancestry, metadata, and shared traversal limits", () => {
    const value = {
      root: {
        type: "root",
        children: [],
        $slots: {
          note: { ...table(1, 1), $: { host: { value: 1 } }, $slots: {} },
        },
      },
    }

    const before = structuredClone(value)

    expect(tablePresentationDocumentSchema.safeParse(value).success).toBe(true)
    expect(value).toEqual(before)
    expect(valid(document({ type: "paragraph", $slots: {} }))).toBe(true)
    expect(
      valid(
        document({
          type: "paragraph",
          $slots: {
            note: {
              type: "paragraph",
              children: Array.from({ length: 9997 }, () => ({ type: "text" })),
            },
          },
        }),
      ),
    ).toBe(true)
    expect(
      valid(
        document({
          type: "paragraph",
          $slots: {
            note: {
              type: "paragraph",
              children: Array.from({ length: 9998 }, () => ({ type: "text" })),
            },
          },
        }),
      ),
    ).toBe(false)

    let node: TestNode & { $slots?: Record<string, TestNode> } = {
      type: "text",
    }

    for (let index = 0; index < 63; index += 1)
      node = { type: "paragraph", $slots: { note: node } }
    expect(valid(document(node))).toBe(true)
    node = { type: "paragraph", $slots: { note: node } }
    expect(valid(document(node))).toBe(false)
    expect(
      valid(document({ ...table(1, 1), $slots: { nested: table(1, 1) } })),
    ).toBe(false)
    expect(
      valid(
        document({
          ...table(1, 1),
          $slots: { row: { type: "tablerow", children: [cell()] } },
        }),
      ),
    ).toBe(false)
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

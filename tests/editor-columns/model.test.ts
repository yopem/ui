import {
  editorColumnsFromHTMLAttributes,
  editorColumnsFromMarkdown,
  editorColumnsHTMLAttributes,
  editorColumnsToMarkdown,
  moveEditorColumnsLayout,
  parseEditorColumnsJSON,
  parseEditorColumnsLayout,
  resizeEditorColumnsLayout,
  validateEditorColumnsJSON,
  validateEditorColumnsHTML,
} from "@editor/columns-model"
import { describe, expect, test } from "bun:test"
import { parseHTML } from "linkedom"

test("columns HTML validation uses the supplied DOM, not ambient constructors", () => {
  const valid = parseHTML(
    '<div data-editor-columns="1" data-editor-columns-layout="50,50"><div data-editor-column="1"><p>One</p></div><div data-editor-column="1"><p>Two</p></div></div>',
  ).document

  expect(() => validateEditorColumnsHTML(valid)).not.toThrow()

  for (const html of [
    '<div data-editor-columns="1" data-editor-columns-layout="[100]"><div data-editor-column="1">One</div></div>',
    '<div data-editor-column="1">Orphan</div>',
  ]) {
    const document = parseHTML(html).document

    expect(() => validateEditorColumnsHTML(document)).toThrow()
  }
})

function columnsDocument(layout: number[] = [50, 50]) {
  return {
    root: {
      type: "root",
      children: [
        {
          type: "editor-columns-group",
          version: 1,
          layout,
          children: layout.map(() => ({
            type: "editor-column",
            version: 1,
            children: [
              {
                type: "paragraph",
                children: [{ type: "text", text: "Column content" }],
              },
            ],
          })),
        },
      ],
    },
  }
}

describe("editor column layout", () => {
  test("accepts two to four bounded widths summing to one hundred", () => {
    expect(parseEditorColumnsLayout([50, 50])).toEqual([50, 50])
    expect(parseEditorColumnsLayout([20, 40, 40])).toEqual([20, 40, 40])
    expect(parseEditorColumnsLayout([25, 25, 25, 25])).toEqual([25, 25, 25, 25])

    for (const layout of [
      [],
      [100],
      [25, 25, 25, 25, 0],
      [10, 90],
      [77, 23],
      [50, 49],
      [50, 50.5],
      [NaN, 50],
      [Infinity, 0],
    ])
      expect(() => parseEditorColumnsLayout(layout)).toThrow()
  })

  test("resizes adjacent columns within bounds and preserves total width", () => {
    expect(resizeEditorColumnsLayout([50, 50], 0, 62)).toEqual([62, 38])
    expect(resizeEditorColumnsLayout([20, 40, 40], 1, 66)).toEqual([20, 66, 14])
    expect(resizeEditorColumnsLayout([20, 40, 40], 1, 90)).toEqual([20, 68, 12])
    expect(moveEditorColumnsLayout([20, 40, 40], 2, 0)).toEqual([40, 20, 40])
    expect(() => resizeEditorColumnsLayout([50, 50], 1, 50)).toThrow()
    expect(() => resizeEditorColumnsLayout([50, 50], 0, Infinity)).toThrow()
  })
})

test("bounded column JSON validates rich children and rejects malformed groups", () => {
  const valid = columnsDocument()
  expect(validateEditorColumnsJSON(valid)).toBeUndefined()
  expect(parseEditorColumnsJSON(JSON.stringify(valid))).toEqual(valid)

  for (const invalid of [
    columnsDocument([50, 49]),
    columnsDocument([50, 50, 0]),
    {
      root: {
        type: "root",
        children: [{ type: "editor-column", version: 1, children: [] }],
      },
    },
    {
      root: {
        type: "root",
        children: [
          {
            type: "editor-columns-group",
            version: 1,
            layout: [50, 50],
            children: [{ type: "editor-column", version: 1, children: [] }],
          },
        ],
      },
    },
  ])
    expect(() => validateEditorColumnsJSON(invalid)).toThrow()

  expect(() => parseEditorColumnsJSON(" ".repeat(1_048_577))).toThrow()
})

test("HTML metadata and Markdown fragments roundtrip without marker collisions", () => {
  const attributes = editorColumnsHTMLAttributes([50, 50])
  expect(editorColumnsFromHTMLAttributes(attributes)).toEqual([50, 50])
  expect(() =>
    editorColumnsFromHTMLAttributes({
      ...attributes,
      "data-editor-columns-layout": "50,50;display:none",
    }),
  ).toThrow()

  const fragment = editorColumnsToMarkdown(
    [50, 50],
    ["Left\n:::editor-column\n\\nested", "Right\n:::end-editor-columns"],
  )

  expect(editorColumnsFromMarkdown(fragment)).toEqual({
    layout: [50, 50],
    columns: [
      "Left\n:::editor-column\n\\nested",
      "Right\n:::end-editor-columns",
    ],
  })
  expect(() => editorColumnsFromMarkdown(fragment.slice(0, -1))).toThrow()
})

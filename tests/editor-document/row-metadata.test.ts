import { createHeadlessEditor } from "@lexical/headless"
import { $createTableNodeWithDimensions, $isTableRowNode } from "@lexical/table"
import {
  documentNodes,
  exportDocument,
  htmlDocument,
  importDocument,
  parseDocument,
  DocumentError,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { $getRoot } from "lexical"
import { parseHTML } from "linkedom"

function editor() {
  return createHeadlessEditor({
    namespace: "row-metadata",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

test.each([
  0,
  -Number.MIN_VALUE,
  Number.MIN_VALUE,
  Number.MAX_VALUE,
  -Number.MAX_VALUE,
  41.125,
])("finite row metadata roundtrips independently of CSS: %s", (height) => {
  const instance = editor()
  instance.update(
    () => {
      const table = $createTableNodeWithDimensions(1, 1, false)
      const row = table.getFirstChild()

      if (!$isTableRowNode(row)) throw new Error("Missing row")
      row.setHeight(height)
      $getRoot().append(table)
    },
    { discrete: true },
  )
  const expected = instance.getEditorState().toJSON()

  for (const format of ["html", "markdown"] as const) {
    const output = exportDocument(instance, format)
    expect(parseDocument(output, format)).toEqual(expected)
  }

  const standaloneRow = parseHTML(
    htmlDocument(instance),
  ).document.querySelector("tr")

  expect(standaloneRow?.getAttribute("data-editor-row-height")).toBe(
    String(height),
  )

  const row = parseHTML(
    exportDocument(instance, "html"),
  ).document.querySelector("tr")

  if (!row) throw new Error("Missing row")
  row.setAttribute("style", "height: 3.40282e+38px")
  expect(parseDocument(row.parentElement?.outerHTML ?? "", "html")).toEqual(
    expected,
  )
})

test.each(["", "NaN", "Infinity", "1px", "1e309", " ", "null"])(
  "invalid row metadata preserves live state: %s",
  (value) => {
    const instance = editor()
    importDocument(instance, "Before", "markdown")
    const before = instance.getEditorState()
    expect(() =>
      importDocument(
        instance,
        `<table><tr data-editor-row-height="${value}"><td>X</td></tr></table>`,
        "html",
      ),
    ).toThrow(DocumentError)
    expect(instance.getEditorState()).toBe(before)
  },
)

test("missing row metadata retains CSS fallback and does not create height", () => {
  const instance = editor()
  importDocument(
    instance,
    '<table><tr style="height: 81.5px"><td>X</td></tr></table>',
    "html",
  )
  expect(exportDocument(instance, "html")).toContain(
    'data-editor-row-height="81.5"',
  )
  importDocument(instance, "<table><tr><td>X</td></tr></table>", "html")
  expect(exportDocument(instance, "html")).not.toContain(
    "data-editor-row-height",
  )
})

test("standalone unresolved semantic colors fail without theme context", () => {
  const instance = editor()
  importDocument(
    instance,
    '<p><span style="color: var(--compiled-foreground)">Color</span></p>',
    "html",
  )
  expect(() => htmlDocument(instance)).toThrow(DocumentError)
})

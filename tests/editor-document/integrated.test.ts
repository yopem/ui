import { $createCodeNode } from "@lexical/code"
import { createHeadlessEditor } from "@lexical/headless"
import { $createTableNodeWithDimensions } from "@lexical/table"
import {
  documentNodes,
  parseDocument,
  importDocument,
  exportDocument,
  documentLimits,
  DocumentError,
  htmlDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $setState,
  createState,
} from "lexical"
import { z } from "zod"

function editor() {
  return createHeadlessEditor({
    namespace: "integrated",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

function nativeTable(rows = 50, columns = 50) {
  const instance = editor()
  instance.update(
    () => {
      $getRoot().append($createTableNodeWithDimensions(rows, columns))
    },
    { discrete: true },
  )

  return instance
}

function structures(value: z.infer<ReturnType<typeof z.json>>): number {
  const object = z
    .union([z.array(z.json()), z.record(z.string(), z.json())])
    .safeParse(value)

  if (!object.success) return 0

  return (
    1 +
    Object.values(object.data).reduce<number>(
      (sum, child) => sum + structures(child),
      0,
    )
  )
}

test("native Lexical 0.52 empty 50x50 JSON and HTML roundtrip", () => {
  const instance = nativeTable()
  const baseline = instance.getEditorState().toJSON()
  const serialized = JSON.stringify(baseline)
  expect(structures(z.json().parse(JSON.parse(serialized)))).toBe(10105)
  expect(new TextEncoder().encode(JSON.stringify(baseline)).length).toBe(669421)

  for (const format of ["json", "html"] as const) {
    const output = exportDocument(instance, format)
    expect(parseDocument(output, format)).toEqual(baseline)
    const target = editor()
    importDocument(target, output, format)
    expect(target.getEditorState().toJSON()).toEqual(baseline)
  }
}, 20_000)

test.each([
  [51, 50],
  [50, 51],
])("native %sx%s rejection preserves live state", (rows, columns) => {
  const invalid = nativeTable(rows, columns)
  const target = editor()
  importDocument(target, "Before", "markdown")
  const before = target.getEditorState()
  expect(() =>
    importDocument(
      target,
      JSON.stringify(invalid.getEditorState().toJSON()),
      "json",
    ),
  ).toThrow(DocumentError)
  expect(target.getEditorState()).toBe(before)

  const html =
    "<table>" +
    Array.from(
      { length: rows },
      () => "<tr>" + "<td><p></p></td>".repeat(columns) + "</tr>",
    ).join("") +
    "</table>"

  expect(() => importDocument(target, html, "html")).toThrow(DocumentError)
  expect(target.getEditorState()).toBe(before)
})

test("aggregate table slots, malformed geometry and spans fail before mutation", () => {
  const target = editor()
  importDocument(target, "Before", "markdown")
  const before = target.getEditorState()
  const table = exportDocument(nativeTable(), "html")

  for (const html of [
    table + "<table><tr><td>X</td></tr></table>",
    '<table><tr><td rowspan="2">X</td></tr></table>',
    '<table><tr><td colspan="51">X</td></tr></table>',
    '<table><tr><td>X</td><td rowspan="2">Y</td></tr><tr><td colspan="2">Z</td></tr></table>',
    "<table><tr><td>X</td></tr><tr><td>X</td><td>Y</td></tr></table>",
    "<table><tr><td><table><tr><td>X</td></tr></table></td></tr></table>",
  ]) {
    expect(() => importDocument(target, html, "html")).toThrow(DocumentError)
    expect(target.getEditorState()).toBe(before)
  }

  const merged =
    '<table><tr><td colspan="50" rowspan="50"><p><strong>Intact</strong></p></td></tr>' +
    "<tr></tr>".repeat(49) +
    "</table>"

  const parsed = parseDocument(merged, "html")
  importDocument(target, JSON.stringify(parsed), "json")
  expect(parseDocument(exportDocument(target, "html"), "html")).toEqual(parsed)
})

test("independent structure, depth and UTF8 byte budgets name failing limit and preserve state", () => {
  const target = editor()
  importDocument(target, "Before", "markdown")
  const before = target.getEditorState()

  const inputs = [
    {
      source: "<p>" + "é".repeat(documentLimits.bytes / 2) + "</p>",
      format: "html",
      limit: "1 MiB",
    },
    {
      source: "<blockquote>".repeat(70) + "X" + "</blockquote>".repeat(70),
      format: "html",
      limit: "depth",
    },
    {
      source: JSON.stringify({
        root: {
          type: "root",
          version: 1,
          children: Array.from({ length: 70000 }, () => ({})),
        },
      }),
      format: "json",
      limit: "structure",
    },
  ] as const

  for (const input of inputs) {
    expect(() => importDocument(target, input.source, input.format)).toThrow(
      input.limit,
    )
    expect(target.getEditorState()).toBe(before)
  }
})

test.each([0, -2, 641, 12000, 1234.5, 1e21])(
  "native finite row height %s survives JSON HTML and Markdown",
  (height) => {
    const target = nativeTable(1, 1)

    const json = JSON.stringify(target.getEditorState().toJSON()).replace(
      '"type":"tablerow"',
      `"height":${height},"type":"tablerow"`,
    )

    importDocument(target, json, "json")

    for (const format of ["json", "html", "markdown"] as const)
      expect(parseDocument(exportDocument(target, format), format)).toEqual(
        target.getEditorState().toJSON(),
      )
  },
)

test("canonical edge state and unrelated safe NodeState survive JSON HTML and Markdown", () => {
  const target = nativeTable(1, 1)
  const edge = { top: "solid", bottom: "hidden", start: null, end: "solid" }

  const json = JSON.stringify(target.getEditorState().toJSON()).replace(
    '"type":"tablecell"',
    `"$":${JSON.stringify({ yopemTableBorder: edge, futureSafe: { enabled: true, count: 3 } })},"type":"tablecell"`,
  )

  importDocument(target, json, "json")

  for (const format of ["json", "html", "markdown"] as const)
    expect(parseDocument(exportDocument(target, format), format)).toEqual(
      target.getEditorState().toJSON(),
    )
  expect(htmlDocument(target)).toContain("border-bottom-style: hidden")
})

test.each([
  '{"top":"solid"}',
  '{"top":"solid","bottom":null,"start":null,"end":"dashed"}',
  "x".repeat(129),
])("malformed canonical border rejected: %s", (border) => {
  expect(() =>
    parseDocument(
      `<table><tr><td data-editor-border='${border}'><p>X</p></td></tr></table>`,
      "html",
    ),
  ).toThrow(DocumentError)
})

test("optional native code view state keeps bounded booleans in JSON; other formats fail explicitly", () => {
  const target = editor()

  const wrap = createState("codeWrap", {
    parse(value) {
      return value !== false
    },
  })

  const numbers = createState("codeLineNumbers", {
    parse(value) {
      return value === true
    },
  })

  target.update(
    () => {
      const code = $createCodeNode("typescript").append(
        $createTextNode("const x = 1"),
      )

      $setState(code, wrap, false)
      $setState(code, numbers, true)
      $getRoot().append(code)
    },
    { discrete: true },
  )
  const json = exportDocument(target, "json")
  expect(parseDocument(json, "json")).toEqual(target.getEditorState().toJSON())

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(target, format)).toThrow("code view")
  expect(() =>
    parseDocument(
      json.replace('"codeWrap":false', '"codeWrap":"false"'),
      "json",
    ),
  ).toThrow(DocumentError)
})

test("block presentation on native code/table/row/cell survives without client extension listeners", () => {
  const target = nativeTable(1, 1)

  const json = JSON.stringify(target.getEditorState().toJSON()).replaceAll(
    '"type":"tablerow"',
    '"$":{"editorBlockPresentation":{"lineHeight":"2","textIndent":"16px"}},"type":"tablerow"',
  )

  importDocument(target, json, "json")
  expect(parseDocument(exportDocument(target, "html"), "html")).toEqual(
    target.getEditorState().toJSON(),
  )
  const code = editor()
  code.update(
    () => {
      $getRoot().append($createParagraphNode())
    },
    { discrete: true },
  )
  importDocument(
    code,
    '<pre style="line-height: 2; text-indent: 16px; text-align: right"><code class="language-ts">&lt;safe&gt;</code></pre>',
    "html",
  )
  expect(parseDocument(exportDocument(code, "html"), "html")).toEqual(
    code.getEditorState().toJSON(),
  )
})

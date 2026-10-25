import { createDocumentEditor } from "@editor/document/convert"
import {
  DocumentError,
  exportDocument,
  htmlDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { expect, test } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

function editor() {
  return createDocumentEditor()
}

test.each([
  {
    html: '<ul data-editor-list-marker="circle"><li>Bullet</li></ul>',
    marker: "circle",
  },
  {
    html: '<ul style="list-style-type: square"><li>Bullet</li></ul>',
    marker: "square",
  },
  {
    html: '<ol data-editor-list-marker="upper-roman" style="list-style-type: upper-roman"><li>Number</li></ol>',
    marker: "upper-roman",
  },
  {
    html: '<ul data-editor-state=\'{"customListMetadata":{"source":"kept"},"yopemListMarker":"disc"}\' data-editor-list-marker="disc"><li>Bullet</li></ul>',
    marker: "disc",
  },
])(
  "HTML marker $marker becomes canonical list state and output",
  ({ html, marker }) => {
    const expected = parseDocument(html, "html")
    const instance = editor()

    importDocument(instance, html, "html")
    const json = exportDocument(instance, "json")
    const output = exportDocument(instance, "html")

    expect(json).toContain(`"yopemListMarker":"${marker}"`)
    expect(output).toContain(`data-editor-list-marker="${marker}"`)
    expect(output).toContain(`list-style-type: ${marker}`)
    expect(parseDocument(output, "html")).toEqual(expected)

    if (html.includes("customListMetadata")) {
      expect(json).toContain('"customListMetadata":{"source":"kept"}')
      expect(parseDocument(output, "html")).toEqual(expected)
    }
  },
)

test.each([
  '<ul data-editor-list-marker="georgian"><li>Bullet</li></ul>',
  '<ul style="list-style-type: georgian"><li>Bullet</li></ul>',
  '<ul style="list-style-type: none"><li>Bullet</li></ul>',
  '<ul data-editor-list-marker="circle" style="list-style-type: square"><li>Bullet</li></ul>',
  '<ul data-editor-state=\'{"yopemListMarker":"square"}\' data-editor-list-marker="circle"><li>Bullet</li></ul>',
  '<ul data-editor-state=\'{"yopemListMarker":"circle"}\' style="list-style-type: square"><li>Bullet</li></ul>',
  '<ul data-editor-state=\'{"yopemListMarker":"georgian"}\'><li>Bullet</li></ul>',
  '<ol data-editor-list-marker="circle"><li>Number</li></ol>',
  '<ul data-editor-list-marker="decimal"><li>Bullet</li></ul>',
  '<ul data-editor-list-marker="disc"><li><input type="checkbox" disabled>Task</li></ul>',
  '<p data-editor-list-marker="circle">Text</p>',
  '<li data-editor-list-marker="circle">Item</li>',
])(
  "invalid list marker metadata rejects without replacing content: %s",
  (html) => {
    const target = editor()

    importDocument(target, "Keep this content", "markdown")
    const before = target.getEditorState()

    expect(() => importDocument(target, html, "html")).toThrow(DocumentError)
    expect(target.getEditorState()).toBe(before)
  },
)

test("JSON list marker state validates placement and list kind", () => {
  const source = JSON.stringify(
    parseDocument(
      '<ul data-editor-list-marker="circle"><li>Bullet</li></ul>',
      "html",
    ),
  )

  const paragraph = JSON.stringify(parseDocument("Text", "markdown")).replace(
    '"type":"paragraph"',
    '"$":{"yopemListMarker":"disc"},"type":"paragraph"',
  )

  const invalid = [
    source.replace(
      '"yopemListMarker":"circle"',
      '"yopemListMarker":"georgian"',
    ),
    source.replace('"listType":"bullet"', '"listType":"number"'),
    paragraph,
  ]

  for (const json of invalid)
    expect(() => parseDocument(json, "json")).toThrow(DocumentError)
})

test.each([-2_147_483_648, -2, 0, 7])(
  "signed ordered start %s survives JSON, HTML, and Markdown",
  (start) => {
    const source = `<ol start="${start}" data-editor-list-marker="lower-roman"><li>Item</li></ol>`
    const instance = editor()

    importDocument(instance, source, "html")
    const expected = instance.getEditorState().toJSON()

    for (const format of ["json", "html", "markdown"] as const) {
      const serialized = exportDocument(instance, format)
      const restored = editor()

      importDocument(restored, serialized, format)
      expect(restored.getEditorState().toJSON()).toEqual(expected)

      if (format !== "json") expect(serialized).toContain(`start="${start}"`)

      if (format === "markdown") {
        expect(serialized).toContain('data-editor-list-marker="lower-roman"')
        expect(serialized).toContain("list-style-type: lower-roman")
      }
    }
  },
)

test.each([
  '<ol start="1.5"><li>Item</li></ol>',
  '<ol start="2147483648"><li>Item</li></ol>',
  '<ol start="-2147483649"><li>Item</li></ol>',
  '<ol start="1e3"><li>Item</li></ol>',
  '<ul start="0"><li>Item</li></ul>',
])("invalid ordered start rejects: %s", (html) => {
  expect(() => parseDocument(html, "html")).toThrow(DocumentError)
})

test("ordinary Markdown lists and native checklists stay Markdown", () => {
  const instance = editor()
  const source = "1. Ordered\n\n- [x] Done\n- [ ] Next"

  importDocument(instance, source, "markdown")
  const markdown = exportDocument(instance, "markdown")
  const restored = editor()

  expect(markdown).not.toContain("<ol")
  expect(markdown).not.toContain("<ul")
  expect(markdown).toContain("- [x] Done")
  importDocument(restored, markdown, "markdown")
  expect(restored.getEditorState().toJSON()).toEqual(
    instance.getEditorState().toJSON(),
  )
})

test("standalone and static output retain marker CSS and signed native start", () => {
  const source =
    '<ol start="-2" data-editor-list-marker="lower-roman"><li>Item</li></ol>'

  const instance = editor()

  importDocument(instance, source, "html")
  const standalone = htmlDocument(instance)

  const rendered = renderToStaticMarkup(
    createElement(DocumentStatic, { html: source }),
  )

  for (const output of [standalone, rendered]) {
    expect(output).toContain('data-editor-list-marker="lower-roman"')
    expect(output).toMatch(/style="[^"]*list-style-type:\s*lower-roman/)
    expect(output).toContain('start="-2"')
  }
})

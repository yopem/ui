import type { HTMLConfig } from "lexical"

import { createHeadlessEditor } from "@lexical/headless"
import { $generateHtmlFromNodes } from "@lexical/html"
import { $createTableNodeWithDimensions } from "@lexical/table"
import { createEditorBlockPresentationHTMLConfig } from "@yopem-ui/editor/block-presentation-extension"
import {
  documentNodes,
  parseDocument,
  importDocument,
  exportDocument,
  DocumentError,
} from "@yopem-ui/editor/document"
import { createEditorTablePresentationHTMLConfig } from "@yopem-ui/editor/table-presentation"
import { expect, test } from "bun:test"
import { $getRoot, $createParagraphNode } from "lexical"
import { parseHTML as parseDOM } from "linkedom"
import { z } from "zod"

function editor(html?: HTMLConfig) {
  return createHeadlessEditor({
    namespace: "native-html",
    html,
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

test("real native 50x50 HTML exporter retains geometry and stabilizes native defaults", () => {
  const window = parseDOM("<!doctype html><html><body></body></html>").window
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")

  const previousDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  )

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: window,
  })
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: window.document,
  })

  try {
    const instance = editor(
      createEditorBlockPresentationHTMLConfig(
        undefined,
        createEditorTablePresentationHTMLConfig(),
      ),
    )

    instance.update(
      () => {
        const table = $createTableNodeWithDimensions(50, 50)
        table.setColWidths(Array.from({ length: 50 }, () => 100))
        $getRoot().append(table)
      },
      { discrete: true },
    )

    const html = instance
      .getEditorState()
      .read(() => $generateHtmlFromNodes(instance), { editor: instance })

    const normalized = parseDocument(html, "html")
    expect(
      z
        .object({ children: z.array(z.unknown()) })
        .parse(normalized.root.children[0]).children.length,
    ).toBe(50)
    const second = editor()
    importDocument(second, html, "html")
    expect(parseDocument(exportDocument(second, "html"), "html")).toEqual(
      normalized,
    )
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")

    if (previousDocument)
      Object.defineProperty(globalThis, "document", previousDocument)
    else Reflect.deleteProperty(globalThis, "document")
  }
}, 20_000)

test.each([
  "border: 2px solid black",
  "border: 1px dashed black",
  "border-radius: 1px",
  "border-image: url(https://evil.test/x)",
  "border-top-style: hidden",
  "border-left-color: red",
])("unsupported native border CSS rejects before state change: %s", (style) => {
  const instance = editor()
  importDocument(instance, "Before", "markdown")
  const before = instance.getEditorState()
  expect(() =>
    importDocument(
      instance,
      `<table><tr><td style="${style}">X</td></tr></table>`,
      "html",
    ),
  ).toThrow(DocumentError)
  expect(instance.getEditorState()).toBe(before)
})

test("element textFormat and textStyle metadata survives HTML and Markdown", () => {
  const instance = editor()

  instance.update(
    () => {
      $getRoot().append(
        $createParagraphNode().setTextFormat(3).setTextStyle("color: #123456"),
      )
    },
    { discrete: true },
  )

  for (const format of ["html", "markdown"] as const)
    expect(parseDocument(exportDocument(instance, format), format)).toEqual(
      instance.getEditorState().toJSON(),
    )
})

test("unsupported code token formatting diagnoses rather than flattening", () => {
  const instance = editor()

  const json = JSON.stringify(
    parseDocument("```ts\ncode\n```", "markdown"),
  ).replace('"format":0', '"format":1')

  importDocument(instance, json, "json")

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(instance, format)).toThrow(DocumentError)
})

test("canonical native cell vertical alignment survives JSON HTML and Markdown", () => {
  const instance = editor()

  const source = JSON.stringify(
    parseDocument("<table><tr><td>X</td></tr></table>", "html"),
  ).replace('"type":"tablecell"', '"verticalAlign":"middle","type":"tablecell"')

  importDocument(instance, source, "json")

  for (const format of ["json", "html", "markdown"] as const)
    expect(parseDocument(exportDocument(instance, format), format)).toEqual(
      instance.getEditorState().toJSON(),
    )
})

test.each(["left", "center", "right"] as const)(
  "native table alignment %s stays table alignment",
  (alignment) => {
    const instance = editor()

    const json = JSON.stringify(
      parseDocument("<table><tr><td>X</td></tr></table>", "html"),
    ).replace('"type":"table"', `"format":"${alignment}","type":"table"`)

    importDocument(instance, json, "json")
    const html = exportDocument(instance, "html")
    expect(
      parseDOM(html).document.querySelector("table")?.getAttribute("align"),
    ).toBe(alignment)

    for (const format of ["html", "markdown"] as const)
      expect(parseDocument(exportDocument(instance, format), format)).toEqual(
        instance.getEditorState().toJSON(),
      )
  },
)

test("cell alignment does not remove native width, background, or vertical alignment in Markdown", () => {
  const instance = editor()
  importDocument(
    instance,
    '<table data-editor-col-widths="[160]"><tr><td style="width: 160px; background-color: #abcdef; vertical-align: middle; text-align: right">Keep</td></tr></table>',
    "html",
  )
  expect(
    parseDocument(exportDocument(instance, "markdown"), "markdown"),
  ).toEqual(instance.getEditorState().toJSON())
})

test("canonical native block HTML serializers retain summary and body", () => {
  const window = parseDOM("<!doctype html><html><body></body></html>").window
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")

  const previousDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  )

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: window,
  })
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: window.document,
  })

  try {
    const instance = editor()
    importDocument(
      instance,
      '<aside data-editor-callout="" data-appearance="info" data-icon="💡"><p>Callout</p></aside><details data-editor-toggle=""><summary>Summary</summary><div data-editor-toggle-body=""><p>Body</p></div></details>',
      "html",
    )

    const html = instance
      .getEditorState()
      .read(() => $generateHtmlFromNodes(instance), { editor: instance })

    const second = editor()

    importDocument(second, html, "html")
    expect(second.getEditorState().toJSON()).toEqual(
      parseDocument(html, "html"),
    )
    expect(parseDocument(exportDocument(second, "html"), "html")).toEqual(
      second.getEditorState().toJSON(),
    )
    expect(html).toContain("<summary")
    expect(html).toContain("data-editor-toggle-body")
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")

    if (previousDocument)
      Object.defineProperty(globalThis, "document", previousDocument)
    else Reflect.deleteProperty(globalThis, "document")
  }
})

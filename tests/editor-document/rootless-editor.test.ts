import { createDocumentEditor } from "@editor/document/convert"
import { createHeadlessEditor } from "@lexical/headless"
import {
  DocumentError,
  documentNodes,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { expect, test } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

function expectNoDOMGlobals() {
  expect("window" in globalThis).toBe(false)
  expect("document" in globalThis).toBe(false)
}

test("document editor starts empty, stays rootless, and supports disposal", () => {
  expectNoDOMGlobals()
  const editor = createDocumentEditor()

  try {
    expect(editor.getRootElement()).toBeNull()
    expect(editor.getEditorState().toJSON().root.children).toEqual([])
    expect(editor).toHaveProperty("dispose")
  } finally {
    editor.dispose()
  }
})

test("public conversion registers optional nodes without DOM globals", () => {
  expectNoDOMGlobals()

  const document = parseDocument(
    '<time data-editor-date="1" datetime="2024-02-29">2024-02-29</time>',
    "html",
  )

  expect(document.root.children).toMatchObject([
    {
      type: "paragraph",
      children: [{ type: "editor-date", date: "2024-02-29" }],
    },
  ])
})

test("parse rejection keeps its error type and does not change target state", () => {
  expectNoDOMGlobals()

  const target = createHeadlessEditor({
    namespace: "rootless-rejection-target",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  importDocument(target, "Keep this content", "markdown")
  const before = target.getEditorState()

  expect(() =>
    importDocument(
      target,
      '<time data-editor-date="1" datetime="2023-02-29">Invalid date</time>',
      "html",
    ),
  ).toThrow(DocumentError)
  expect(target.getEditorState()).toBe(before)
})

test("DocumentStatic renders on the server without DOM globals", () => {
  expectNoDOMGlobals()

  const html = renderToStaticMarkup(
    createElement(DocumentStatic, { html: "<p>Server output</p>" }),
  )

  expect(html).toContain("Server output")
})

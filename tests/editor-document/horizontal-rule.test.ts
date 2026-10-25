import { exportDocument, importDocument, parseDocument } from "@editor/document"
import { createDocumentEditor } from "@editor/document/convert"
import { createHeadlessEditor } from "@lexical/headless"
import { expect, test } from "bun:test"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"

const element = { version: 1, direction: null, format: "", indent: 0 }

const rule = { type: "horizontalrule", version: 1 }

const document = JSON.stringify({
  root: { ...element, type: "root", children: [rule] },
})

test("native horizontal rules retain JSON, HTML and Markdown semantics", () => {
  const editor = createDocumentEditor()
  editor.setEditorState(editor.parseEditorState(document))
  const serialized = exportDocument(editor, "json")
  expect(parseDocument(serialized, "json").root.children).toContainEqual(rule)
  const html = exportDocument(editor, "html")
  expect(html).toContain("<hr")
  expect(parseDocument(html, "html").root.children).toContainEqual(rule)
  const markdown = exportDocument(editor, "markdown")
  expect(parseDocument(markdown, "markdown").root.children).toContainEqual(rule)
})

test("horizontal rules reject unrelated metadata, children and inline placement", () => {
  for (const extra of [
    { children: [] },
    { format: "left" },
    { text: "hidden" },
    { $: { editorBlockPresentation: { lineHeight: "2", textIndent: "0px" } } },
  ]) {
    expect(() =>
      parseDocument(
        JSON.stringify({
          root: { ...element, type: "root", children: [{ ...rule, ...extra }] },
        }),
        "json",
      ),
    ).toThrow()
  }

  expect(() =>
    parseDocument(
      JSON.stringify({
        root: {
          ...element,
          type: "root",
          children: [{ ...element, type: "paragraph", children: [rule] }],
        },
      }),
      "json",
    ),
  ).toThrow()
  expect(() => parseDocument('<hr data-editor-state="{}">', "html")).toThrow()
  expect(() => parseDocument('<hr style="color: red">', "html")).toThrow()
})

test("missing native rule registration rejects imports without losing current content", () => {
  const target = createHeadlessEditor({
    namespace: "missing-horizontal-rule",
    onError(error) {
      throw error
    },
  })

  target.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode("Keep current text")),
      )
    },
    { discrete: true },
  )
  const before = JSON.stringify(target.getEditorState().toJSON())
  expect(() => importDocument(target, document, "json")).toThrow()
  expect(JSON.stringify(target.getEditorState().toJSON())).toBe(before)
})

import { $createCodeNode } from "@lexical/code"
import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  importDocument,
  exportDocument,
  DocumentError,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical"

test.each(["token", "directionless", "unmergeable"] as const)(
  "native text metadata %s requires JSON",
  (mode) => {
    const editor = createHeadlessEditor({
      namespace: "unsupported",
      nodes: documentNodes,
      onError(error) {
        throw error
      },
    })

    editor.update(
      () => {
        const text = $createTextNode("Keep")

        if (mode === "token") text.setMode("token")
        else if (mode === "directionless") text.toggleDirectionless()
        else text.toggleUnmergeable()
        $getRoot().append($createParagraphNode().append(text))
      },
      { discrete: true },
    )
    const source = exportDocument(editor, "json")
    expect(parseDocument(source, "json")).toEqual(
      editor.getEditorState().toJSON(),
    )

    for (const format of ["html", "markdown"] as const)
      expect(() => exportDocument(editor, format)).toThrow(DocumentError)

    const target = createHeadlessEditor({
      namespace: "target",
      nodes: documentNodes,
      onError(error) {
        throw error
      },
    })

    importDocument(target, source, "json")
    expect(target.getEditorState().toJSON()).toEqual(
      editor.getEditorState().toJSON(),
    )
  },
)

test("unsupported language classes diagnose before HTML export", () => {
  const editor = createHeadlessEditor({
    namespace: "language",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      $getRoot().append(
        $createCodeNode("ts unsafe").append($createTextNode("Keep")),
      )
    },
    { discrete: true },
  )
  expect(parseDocument(exportDocument(editor, "json"), "json")).toEqual(
    editor.getEditorState().toJSON(),
  )

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(editor, format)).toThrow(DocumentError)
})

test("root NodeState remains JSON-only instead of disappearing", () => {
  const editor = createHeadlessEditor({
    namespace: "root-state",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  const source = JSON.stringify(parseDocument("Text", "markdown")).replace(
    '"type":"root"',
    '"$":{"futureRoot":{"mode":"safe"}},"type":"root"',
  )

  importDocument(editor, source, "json")
  expect(parseDocument(exportDocument(editor, "json"), "json")).toEqual(
    editor.getEditorState().toJSON(),
  )

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(editor, format)).toThrow(DocumentError)
})

test.each([
  '<table style="table-layout: fixed; inline-size: 999999px" data-editor-col-widths="[120]"><tr><td>X</td></tr></table>',
  '<table style="table-layout: fixed; inline-size: 120px"><tr><td>X</td></tr></table>',
  '<table><tr><td style="min-inline-size: 0; overflow-wrap: anywhere">X</td></tr></table>',
])(
  "table layout without matching bounded columns preserves old state",
  (html) => {
    const editor = createHeadlessEditor({
      namespace: "layout",
      nodes: documentNodes,
      onError(error) {
        throw error
      },
    })

    importDocument(editor, "Before", "markdown")
    const before = editor.getEditorState()
    expect(() => importDocument(editor, html, "html")).toThrow(DocumentError)
    expect(editor.getEditorState()).toBe(before)
  },
)

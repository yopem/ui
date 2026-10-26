import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  DocumentError,
  exportDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"

for (const key of [
  "yopemReview",
  "yopemSuggestion",
  "yopemReviewStructural",
] as const) {
  test(`generic document IO rejects ${key} without replacing current content`, () => {
    const editor = createHeadlessEditor({
      namespace: `document-review-boundary-${key}`,
      nodes: documentNodes,
      onError(cause) {
        throw cause
      },
    })

    importDocument(editor, "Keep current document", "markdown")
    const before = editor.getEditorState()
    const next = parseDocument("Untrusted replacement", "markdown")

    const source = JSON.stringify({
      root: { ...next.root, $: { [key]: { version: 1, proposals: [] } } },
    })

    expect(() => parseDocument(source, "json")).toThrow(DocumentError)
    expect(() => importDocument(editor, source, "json")).toThrow(DocumentError)
    expect(editor.getEditorState()).toBe(before)
    editor.setEditorState(editor.parseEditorState(source))
    expect(() => exportDocument(editor, "json")).toThrow(DocumentError)
  })
}

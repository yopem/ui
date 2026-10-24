import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  DocumentError,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"

for (const type of [
  "image",
  "video",
  "audio",
  "mention",
  "math",
  "equation",
  "review",
  "track-change",
]) {
  test(`unsupported ${type} JSON preserves live state`, () => {
    const editor = createHeadlessEditor({
      namespace: "unsupported-format",
      nodes: documentNodes,
      onError(error) {
        throw error
      },
    })

    importDocument(editor, "Keep current document", "markdown")
    const before = editor.getEditorState()
    const document = parseDocument("Replacement", "markdown")

    const source = JSON.stringify(document).replace(
      '"type":"text"',
      `"type":"${type}"`,
    )

    expect(() => importDocument(editor, source, "json")).toThrow(DocumentError)
    expect(editor.getEditorState()).toBe(before)
  })
}

for (const source of [
  '<img src="https://example.com/image.png">',
  "<video controls></video>",
  "<math><mi>x</mi></math>",
  '<span data-mention-id="user">User</span>',
  "<ins>Review insertion</ins>",
  '<del data-review-id="revision">Review deletion</del>',
]) {
  test(`unsupported HTML preserves live state: ${source}`, () => {
    const editor = createHeadlessEditor({
      namespace: "unsupported-html",
      nodes: documentNodes,
      onError(error) {
        throw error
      },
    })

    importDocument(editor, "Keep current document", "markdown")
    const before = editor.getEditorState()
    expect(() => importDocument(editor, source, "html")).toThrow(DocumentError)
    expect(editor.getEditorState()).toBe(before)
  })
}

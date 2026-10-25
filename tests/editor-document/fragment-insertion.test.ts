import { createHeadlessEditor } from "@lexical/headless"
import { MarkNode, $getMarkIDs } from "@lexical/mark"
import {
  $insertDocumentFragment,
  DocumentError,
  documentNodes,
  importDocument,
} from "@yopem-ui/editor/document"
import {
  createEditorReview,
  editorReviewState,
} from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getState,
  HISTORY_PUSH_TAG,
} from "lexical"

function createDocumentEditor() {
  return createHeadlessEditor({
    namespace: "document-fragment-insertion",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

function selectTextEnd(editor: ReturnType<typeof createDocumentEditor>) {
  editor.update(
    () => {
      const text = $getRoot().getAllTextNodes()[0]

      if (!text) throw new Error("Test document has no text.")
      text.selectEnd()
    },
    { discrete: true },
  )
}

test("validated Markdown fragment insertion keeps rich nodes and surrounding blocks", () => {
  const editor = createDocumentEditor()
  importDocument(editor, "Before\n\nAfter", "markdown")
  editor.update(
    () => {
      const first = $getRoot().getAllTextNodes()[0]

      if (!first) throw new Error("Test document has no text.")
      first.selectEnd()
      $insertDocumentFragment("## Generated heading\n\n**Approved rich text**")
    },
    { tag: HISTORY_PUSH_TAG, discrete: true },
  )

  editor.getEditorState().read(() => {
    const root = $getRoot()

    const richText = root
      .getAllTextNodes()
      .find((text) => text.getTextContent() === "Approved rich text")

    expect(root.getTextContent()).toContain("Before")
    expect(root.getTextContent()).toContain("Generated heading")
    expect(root.getTextContent()).toContain("After")
    expect(root.getChildren().map((node) => node.getType())).toContain(
      "heading",
    )
    expect(richText?.hasFormat("bold")).toBe(true)
  })
})

test("unsafe Markdown and proposal-supplied review state reject without mutation", () => {
  const editor = createDocumentEditor()
  importDocument(editor, "Keep this document", "markdown")

  for (const source of [
    "<script>alert(1)</script>",
    `<p data-editor-state='{"yopemReview":{"version":1,"threads":[]}}'>Untrusted</p>`,
    `<p data-editor-state='{"yopemSuggestion":{"kind":"insert"}}'>Untrusted</p>`,
  ]) {
    selectTextEnd(editor)
    const before = editor.getEditorState().toJSON()

    expect(() =>
      editor.update(() => $insertDocumentFragment(source), { discrete: true }),
    ).toThrow(DocumentError)
    expect(editor.getEditorState().toJSON()).toEqual(before)
  }
})

test("unregistered fragment nodes reject without replacing the current document", () => {
  const editor = createHeadlessEditor({
    namespace: "document-fragment-missing-node",
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const text = $createTextNode("Keep this document")
      $getRoot().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  const table = "| Name | Value |\n| --- | --- |\n| A | B |"

  expect(() =>
    editor.update(() => $insertDocumentFragment(table), { discrete: true }),
  ).toThrow(DocumentError)
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("oversized Markdown fragment rejects without mutation", () => {
  const editor = createDocumentEditor()
  importDocument(editor, "Keep this document", "markdown")
  selectTextEnd(editor)
  const before = editor.getEditorState().toJSON()

  expect(() =>
    editor.update(() => $insertDocumentFragment("x".repeat(1_048_577)), {
      discrete: true,
    }),
  ).toThrow(DocumentError)
  expect(editor.getEditorState().toJSON()).toEqual(before)
})

test("Markdown insertion preserves trusted review anchors and root state", () => {
  const editor = createHeadlessEditor({
    namespace: "document-fragment-review-state",
    nodes: [...documentNodes, MarkNode],
    onError(error) {
      throw error
    },
  })

  const controller = createEditorReview()
  const cleanup = controller.register(editor)
  const review = controller.forEditor(editor)
  review.setHost({
    viewer: { id: "fragment-reviewer", name: "Fragment reviewer" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  importDocument(editor, "Trusted anchor text", "markdown")
  let threadId = ""
  editor.update(
    () => {
      const text = $getRoot().getAllTextNodes()[0]

      if (!text) throw new Error("Test document has no text.")
      text.select(0, 7)
      threadId = review.$createThread("Trusted comment")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      const text = $getRoot().getAllTextNodes().at(-1)

      if (!text) throw new Error("Test document has no text.")
      text.selectEnd()
      $insertDocumentFragment("## Added section")
    },
    { tag: HISTORY_PUSH_TAG, discrete: true },
  )

  editor.getEditorState().read(() => {
    const reviewState = $getState($getRoot(), editorReviewState)

    const anchor = $getRoot()
      .getAllTextNodes()
      .find((text) => $getMarkIDs(text, 1)?.includes(threadId) === true)

    expect(reviewState.threads.map((thread) => thread.id)).toContain(threadId)
    expect(anchor).toBeDefined()
    expect($getRoot().getTextContent()).toContain("Added section")
  })
  cleanup()
})

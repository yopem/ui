import { buildEditorFromExtensions } from "@lexical/extension"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"

test("comment requests authorize before opening and anchor a collapsed paragraph caret", () => {
  const scope = createEditorReview()
  const editor = buildEditorFromExtensions(scope.extension)
  const review = scope.forEditor(editor)
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  expect(review.requestComment()).toBe(false)
  expect(review.getView().commentRequest).toBe(0)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  expect(review.requestComment()).toBe(true)
  expect(review.getView().commentRequest).toBe(1)
  expect(
    review.run(() => {
      review.restore()
      review.$createThread("Check")
    }),
  ).toBe(true)
  expect(review.getView().data.threads).toHaveLength(1)
  expect(review.getView().detachedThreadIds).toHaveLength(0)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispose()
})

import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  configExtension,
  defineExtension,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"

test("native history requires current host authorization and preserves suggestion metadata", () => {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-history-test",
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)

  const host = {
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  }

  review.setHost(host)
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
  editor.update(
    () => {
      review.$suggestInsert(" extra")
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
  review.setHost(null)
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original extra"))
  review.setHost(host)
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original extra"))
  expect(review.getView().suggestions).toHaveLength(1)
  expect(review.getView().diagnostic).toBe("")
  editor.dispose()
})

test("decisions undo and redo one suggestion while another remains pending", () => {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-independent-history-decisions",
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        controller.extension,
      ],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)

  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("First")),
          $createParagraphNode().append($createTextNode("Second")),
        )
    },
    { discrete: true },
  )
  let firstId = ""
  let secondId = ""
  expect(
    review.run(() => {
      $getRoot().getAllTextNodes()[0].selectEnd()
      firstId = review.$suggestInsert(" one")
    }),
  ).toBe(true)
  expect(
    review.run(() => {
      $getRoot()
        .getAllTextNodes()
        .find((node) => node.getTextContent() === "Second")!
        .selectEnd()
      secondId = review.$suggestInsert(" two")
    }),
  ).toBe(true)
  expect(new Set([firstId, secondId]).size).toBe(2)

  expect(review.run(() => review.$decide(firstId, "accept"))).toBe(true)
  expect(review.getView().suggestions.map((item) => item.id)).toEqual([
    secondId,
  ])
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toContain("First one"))
  expect(review.getView().suggestions.map((item) => item.id)).toEqual(
    expect.arrayContaining([firstId, secondId]),
  )
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toContain("First one"))
  expect(review.getView().suggestions.map((item) => item.id)).toEqual([
    secondId,
  ])
  editor.read(() => {
    expect($getRoot().getTextContent()).toContain("First one")
    expect($getRoot().getTextContent()).toContain("Second two")
  })
  editor.dispose()
})

test("discussion-only updates have separate authorized history entries", () => {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-discussion-history",
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        controller.extension,
      ],
    }),
  )

  const review = controller.forEditor(editor)
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, 8)
    },
    { discrete: true },
  )
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  let id = ""
  expect(
    review.run(() => {
      id = review.$createThread("First")
    }),
  ).toBe(true)
  expect(
    review.run(() => {
      review.$reply(id, "Second")
    }),
  ).toBe(true)
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  expect(review.getView().data.threads[0].comments).toHaveLength(1)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispatchCommand(REDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  expect(review.getView().data.threads[0].comments).toHaveLength(2)
  editor.dispose()
})

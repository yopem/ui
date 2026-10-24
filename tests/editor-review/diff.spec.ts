import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { deriveReviewTextDiff } from "@yopem-ui/editor/review-diff"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getState,
  $setState,
  createState,
  configExtension,
  defineExtension,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical"
import { z } from "zod"

test("bounded deterministic text diffs reconstruct both values without splitting graphemes", () => {
  for (const [before, after] of [
    ["abXcdYef", "abQcdRef"],
    ["", "New"],
    ["Old", ""],
    ["e\u0301👩‍👩‍👧‍👦!", "e\u0301🙂!"],
    ["same", "same"],
  ]) {
    const operations = deriveReviewTextDiff(before, after)
    expect(
      operations
        .filter((part) => part.kind !== "insert")
        .map((part) => part.text)
        .join(""),
    ).toBe(before)
    expect(
      operations
        .filter((part) => part.kind !== "delete")
        .map((part) => part.text)
        .join(""),
    ).toBe(after)
    expect(deriveReviewTextDiff(before, after)).toEqual(operations)

    for (const part of operations) expect(part.offset).toBeGreaterThanOrEqual(0)
  }

  expect(
    deriveReviewTextDiff("e\u0301👩‍👩‍👧‍👦!", "e\u0301🙂!").some(
      (part) => part.kind === "delete" && part.text === "👩‍👩‍👧‍👦",
    ),
  ).toBe(true)
  expect(() => deriveReviewTextDiff("before", "after\nblock")).toThrow()
  expect(() => deriveReviewTextDiff("", "x".repeat(4097))).toThrow()
})

test("native document text diff keeps anchors and NodeState through decisions and history", () => {
  const scope = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-diff-test",
      dependencies: [
        configExtension(HistoryExtension, { disabled: false }),
        scope.extension,
      ],
    }),
  )

  const review = scope.forEditor(editor)

  const unrelated = createState("review-diff-unrelated", {
    parse(value) {
      return z.string().catch("").parse(value)
    },
  })

  editor.update(
    () => {
      const text = $createTextNode("abXcdYef")
      $setState(text, unrelated, "keep")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(3, 5)
    },
    { discrete: true },
  )
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  expect(
    review.run(() => {
      review.$createThread("Anchor")
    }),
  ).toBe(true)
  expect(
    review.run(() => {
      review.$suggestDocumentText("abQcdRef")
    }),
  ).toBe(true)
  expect(
    review.getView().suggestions.some((part) => part.kind === "replace"),
  ).toBe(true)
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  editor.read(() => expect($getRoot().getTextContent()).toBe("abXcdYef"))
  expect(review.getView().suggestions).toHaveLength(0)
  editor.dispatchCommand(REDO_COMMAND, undefined)
  expect(
    review.run(() => {
      review.$decideAll("reject")
    }),
  ).toBe(true)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("abXcdYef")
    expect(
      $getRoot()
        .getAllTextNodes()
        .every((node) => $getState(node, unrelated) === "keep"),
    ).toBe(true)
  })
  expect(
    review.run(() => {
      review.$suggestDocumentText("abQcdRef")
    }),
  ).toBe(true)
  expect(
    review.run(() => {
      review.$decideAll("accept")
    }),
  ).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe("abQcdRef"))
  expect(review.getView().detachedThreadIds).toHaveLength(0)
  review.setHost({
    viewer: null,
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  expect(
    review.run(() => {
      review.$suggestDocumentText("Lost")
    }),
  ).toBe(false)
  editor.read(() => expect($getRoot().getTextContent()).toBe("abQcdRef"))
  editor.dispose()
})

test("adjacent replacement fragments share one atomic review decision", () => {
  const scope = createEditorReview()
  const editor = buildEditorFromExtensions(scope.extension)
  const review = scope.forEditor(editor)
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("aXb")))
    },
    { discrete: true },
  )
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  expect(
    review.run(() => {
      review.$suggestDocumentText("aYb")
    }),
  ).toBe(true)
  expect(review.getView().suggestions).toHaveLength(1)
  const proposal = review.getView().suggestions[0]
  expect(proposal.kind).toBe("replace")
  expect(
    review.run(() => {
      review.$decide(proposal.id, "reject")
    }),
  ).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe("aXb"))
  expect(review.getView().suggestions).toHaveLength(0)
  expect(
    review.run(() => {
      review.$suggestDocumentText("aYb")
    }),
  ).toBe(true)
  expect(
    review.run(() => {
      review.$decide(review.getView().suggestions[0].id, "accept")
    }),
  ).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe("aYb"))
  editor.dispose()
})

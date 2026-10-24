import { MarkNode, $getMarkIDs } from "@lexical/mark"
import {
  createEditorReview,
  editorReviewState,
  editorSuggestionState,
} from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  createEditor,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $getState,
  $setState,
  createState,
} from "lexical"
import { z } from "zod"

function setup() {
  const editor = createEditor({
    namespace: "review-test",
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
  })

  const controller = createEditorReview()
  const cleanup = controller.register(editor)
  const review = controller.forEditor(editor)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append($createTextNode("Original text")),
      )
    },
    { discrete: true },
  )

  return { editor, review, cleanup }
}

function select(
  editor: ReturnType<typeof createEditor>,
  start: number,
  end: number,
) {
  editor.update(
    () => {
      const text = $getRoot().getAllTextNodes()[0]
      text.select(start, end)
    },
    { discrete: true },
  )
}

test("native anchored thread lifecycle survives JSON", () => {
  const { editor, review, cleanup } = setup()
  select(editor, 0, 8)
  let thread = ""
  editor.update(
    () => {
      thread = review.$createThread("First")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      const reply = review.$reply(thread, "Reply")
      review.$editComment(thread, reply, "Edited")
      review.$resolve(thread, true)
      review.$resolve(thread, false)
    },
    { discrete: true },
  )
  editor.getEditorState().read(() => {
    const data = $getState($getRoot(), editorReviewState)
    expect(data.threads[0].id).toBe(thread)
    expect(data.threads[0].comments.map((c) => c.text)).toEqual([
      "First",
      "Edited",
    ])
    expect($getMarkIDs($getRoot().getAllTextNodes()[0], 1)).toContain(thread)
  })

  const state = editor.parseEditorState(
    JSON.stringify(editor.getEditorState().toJSON()),
  )

  editor.setEditorState(state)
  editor.update(
    () => {
      review.$deleteThread(thread)
    },
    { discrete: true },
  )
  editor.getEditorState().read(() => {
    expect($getRoot().getTextContent()).toBe("Original text")
    expect($getState($getRoot(), editorReviewState).threads).toHaveLength(0)
  })
  cleanup()
})

test("native insertion, deletion and formatting keep original and unrelated NodeState", () => {
  const { editor, review, cleanup } = setup()

  const unrelated = createState("review-test-unrelated", {
    parse: (value) => z.string().catch("").parse(value),
  })

  select(editor, 0, 8)
  let id = ""
  editor.update(
    () => {
      $setState($getRoot(), unrelated, "keep")
      id = review.$suggestDelete()
    },
    { discrete: true },
  )
  editor.getEditorState().read(() => {
    expect($getRoot().getTextContent()).toBe("Original text")
    expect(
      $getState($getRoot().getAllTextNodes()[0], editorSuggestionState)?.kind,
    ).toBe("delete")
  })
  editor.update(
    () => {
      review.$decide(id, "reject")
    },
    { discrete: true },
  )
  select(editor, 0, 8)
  editor.update(
    () => {
      id = review.$suggestFormat("bold")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      review.$decide(id, "reject")
    },
    { discrete: true },
  )
  editor.getEditorState().read(() => {
    expect($getRoot().getAllTextNodes()[0].hasFormat("bold")).toBe(false)
  })
  select(editor, 0, 0)
  editor.update(
    () => {
      id = review.$suggestInsert("New ")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      review.$decide(id, "reject")
    },
    { discrete: true },
  )
  editor.getEditorState().read(() => {
    expect($getRoot().getTextContent()).toBe("Original text")
    expect($getState($getRoot(), unrelated)).toBe("keep")
  })
  cleanup()
})

test("denial, readonly, stale selection and unmount cannot mutate", () => {
  const { editor, review, cleanup } = setup()
  select(editor, 0, 8)
  review.capture()
  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0].setTextContent("Changed")
    },
    { discrete: true },
  )
  expect(review.restore).toThrow()
  review.setHost(null)
  expect(() =>
    editor.update(() => review.$createThread("No"), { discrete: true }),
  ).toThrow()
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.setEditable(false)
  expect(() =>
    editor.update(() => review.$suggestInsert("No"), { discrete: true }),
  ).toThrow()
  cleanup()
  expect(() =>
    editor.update(() => review.$suggestInsert("No"), { discrete: true }),
  ).toThrow()
})

test("bulk decisions preflight all host permissions and never partially mutate", () => {
  const { editor, review, cleanup } = setup()
  select(editor, 0, 4)
  let id = ""
  editor.update(
    () => {
      id = review.$suggestDelete()
    },
    { discrete: true },
  )
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: (action) => action !== "accept",
  })
  expect(() =>
    editor.update(() => review.$decideAll("accept"), { discrete: true }),
  ).toThrow()
  editor.getEditorState().read(() => {
    expect($getRoot().getTextContent()).toBe("Original text")
    expect(
      $getState($getRoot().getAllTextNodes()[0], editorSuggestionState)?.id,
    ).toBe(id)
    expect($isRangeSelection($getSelection())).toBe(true)
  })
  cleanup()
})

test("removed anchors keep discussion IDs and report detachment", () => {
  const { editor, review, cleanup } = setup()
  select(editor, 0, 8)
  let id = ""
  editor.update(
    () => {
      id = review.$createThread("Keep discussion")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0].remove()
    },
    { discrete: true },
  )
  expect(review.getView().detachedThreadIds).toContain(id)
  expect(review.getView().data.threads[0].id).toBe(id)
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe(" text"))
  cleanup()
})

test("suggestion descriptions are bounded, selectable, and hidden with host visibility", () => {
  const editor = createEditor({
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
  })

  const scope = createEditorReview()
  const cleanup = scope.register(editor)
  const review = scope.forEditor(editor)

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
      $getRoot().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )

  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestInsert("x".repeat(300))
    }),
  ).toBe(true)

  const description = review.getView().suggestions[0]
  expect(description.insertedText).toBe("x".repeat(160))
  expect(description.removedText).toBe("")
  expect(Object.isFrozen(description)).toBe(true)
  expect(review.goToSuggestion(id)).toBe(true)
  editor.read(() =>
    expect($getSelection()?.getTextContent()).toBe("x".repeat(300)),
  )
  review.setHost({ ...host, visible: false })
  expect(review.getView().suggestions).toHaveLength(0)
  expect(review.goToSuggestion(id)).toBe(false)
  cleanup()
})

test("editing imported future timestamps keeps monotonic comment metadata", () => {
  const { editor, review, cleanup } = setup()
  const future = Date.now() + 60000
  editor.update(
    () => {
      $setState($getRoot(), editorReviewState, {
        version: 1,
        threads: [
          {
            id: "future-thread",
            resolved: false,
            comments: [
              {
                id: "future-comment",
                author: { id: "alice", name: "Alice" },
                text: "Old",
                createdAt: future,
                updatedAt: future,
              },
            ],
          },
        ],
      })
    },
    { discrete: true },
  )
  expect(
    review.run(() => {
      review.$editComment("future-thread", "future-comment", "Changed")
    }),
  ).toBe(true)
  const comment = review.getView().data.threads[0].comments[0]
  expect(comment.text).toBe("Changed")
  expect(comment.createdAt).toBe(future)
  expect(comment.updatedAt).toBeGreaterThanOrEqual(future)
  cleanup()
})

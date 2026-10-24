import type { EditorReviewHost } from "@yopem-ui/editor/review-model"

import { MarkNode } from "@lexical/mark"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical"

function setup() {
  const editor = createEditor({
    namespace: "review-availability",
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
  })

  const controller = createEditorReview()
  const cleanup = controller.register(editor)
  const review = controller.forEditor(editor)

  function setPolicy(can: EditorReviewHost["can"], replyWhileReadonly = false) {
    review.setHost({
      viewer: { id: "host-viewer", name: "Host viewer" },
      visible: true,
      replyWhileReadonly,
      can,
    })
  }

  setPolicy(() => true)
  let threadId = ""
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().append($createParagraphNode().append(text))
      text.select(0, 4)
      threadId = review.$createThread("First comment")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().getAllTextNodes()[0].selectEnd()
      review.$suggestInsert(" First")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().getAllTextNodes().at(-1)!.selectEnd()
      review.$suggestInsert(" Second")
    },
    { discrete: true },
  )

  return { editor, review, cleanup, setPolicy, threadId }
}

for (const action of ["accept", "reject"] as const) {
  test(`bulk ${action} checks each target without an undefined policy request`, () => {
    const { editor, review, cleanup, setPolicy } = setup()

    try {
      const ids = review.getView().suggestions.map((item) => item.id)
      expect(ids).toHaveLength(2)
      const calls: string[] = []
      setPolicy((requested, id, viewer) => {
        expect(viewer.id).toBe("host-viewer")
        expect(requested).toBe(action)

        if (id === undefined) throw new Error("Target required")
        calls.push(id)

        return ids.includes(id)
      })
      expect(review.availableAllDecisions(action)).toBe(true)
      expect(calls).toEqual(ids)
      editor.update(() => review.$decideAll(action), { discrete: true })
      expect(review.getView().suggestions).toHaveLength(0)
      expect(review.availableAllDecisions(action)).toBe(false)
    } finally {
      cleanup()
    }
  })

  test(`bulk ${action} fails closed when one target is denied`, () => {
    const { review, cleanup, setPolicy } = setup()

    try {
      const before = review.getView().suggestions
      setPolicy((requested, id) => requested === action && id !== before[1].id)
      expect(review.availableAllDecisions(action)).toBe(false)
      expect(review.run(() => review.$decideAll(action))).toBe(false)
      expect(review.getView().suggestions).toEqual(before)
      setPolicy(() => {
        throw new Error("Policy failed")
      })
      expect(review.availableAllDecisions(action)).toBe(false)
      const invalidPolicy = { can: () => true }
      Reflect.set(invalidPolicy, "can", () => Promise.resolve(true))
      setPolicy(invalidPolicy.can)
      expect(review.availableAllDecisions(action)).toBe(false)
      expect(review.run(() => review.$decideAll(action))).toBe(false)
      expect(review.getView().suggestions).toEqual(before)
      setPolicy(() => true)
      review.setHost(null)
      expect(review.availableAllDecisions(action)).toBe(false)
    } finally {
      cleanup()
    }
  })
}

test("final comment deletion requires comment and thread grants", () => {
  const { editor, review, cleanup, setPolicy, threadId } = setup()

  try {
    const before = review.getView().data
    const commentId = before.threads[0].comments[0].id
    setPolicy((action, id) => action === "delete" && id === commentId)
    expect(review.availableDeleteComment(threadId, commentId)).toBe(false)
    expect(review.run(() => review.$deleteComment(threadId, commentId))).toBe(
      false,
    )
    expect(review.getView().data).toEqual(before)
    setPolicy((action, id) => action === "delete" && id === threadId)
    expect(review.availableDeleteComment(threadId, commentId)).toBe(false)
    const calls: string[] = []
    setPolicy((action, id) => {
      expect(action).toBe("delete")

      if (id === undefined) throw new Error("Target required")
      calls.push(id)

      return id === commentId || id === threadId
    })
    expect(review.availableDeleteComment(threadId, commentId)).toBe(true)
    expect(calls).toEqual([commentId, threadId])
    editor.update(() => review.$deleteComment(threadId, commentId), {
      discrete: true,
    })
    expect(review.getView().data.threads).toHaveLength(0)
    expect(review.availableDeleteComment(threadId, commentId)).toBe(false)
  } finally {
    cleanup()
  }
})

test("non-final comment deletion needs no thread grant and respects readonly", () => {
  const { editor, review, cleanup, setPolicy, threadId } = setup()

  try {
    const commentId = review.getView().data.threads[0].comments[0].id
    editor.update(() => review.$reply(threadId, "Reply"), { discrete: true })
    const calls: (string | undefined)[] = []

    function canDelete(
      action: Parameters<EditorReviewHost["can"]>[0],
      id?: string,
    ) {
      calls.push(id)

      return action === "delete" && id === commentId
    }

    setPolicy(canDelete)
    expect(review.availableDeleteComment(threadId, commentId)).toBe(true)
    expect(calls).toEqual([commentId])
    expect(review.availableDeleteComment("missing-thread", commentId)).toBe(
      false,
    )
    expect(review.availableDeleteComment(threadId, "missing-comment")).toBe(
      false,
    )
    editor.setEditable(false)
    expect(review.availableDeleteComment(threadId, commentId)).toBe(false)
    expect(review.availableAllDecisions("accept")).toBe(false)
    setPolicy(canDelete, true)
    expect(review.availableDeleteComment(threadId, commentId)).toBe(true)
    expect(review.availableAllDecisions("accept")).toBe(false)
    editor.update(() => review.$deleteComment(threadId, commentId), {
      discrete: true,
    })
    expect(review.getView().data.threads[0].comments).toHaveLength(1)
    review.setHost(null)
    expect(review.availableDeleteComment(threadId, commentId)).toBe(false)
  } finally {
    cleanup()
  }
})

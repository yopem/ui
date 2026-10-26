import { CodeExtension, $createCodeNode } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import { MarkNode } from "@lexical/mark"
import { parseEditorReview } from "@yopem-ui/editor/review-codecs"
import { editorReviewState } from "@yopem-ui/editor/review-extension"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import { $nodesOfType } from "lexical"
import { $setState, $getState, createState } from "lexical"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  defineExtension,
} from "lexical"
import { z } from "zod"

test("unsupported native structure is discarded before the next authorized action", () => {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-fault-test",
      dependencies: [controller.extension],
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
      const text = $createTextNode("Original text")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, 4)
    },
    { discrete: true },
  )
  let id = ""
  editor.update(
    () => {
      id = review.$suggestDelete()
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().clear()
    },
    { discrete: true },
  )
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Original text"))
  expect(
    review.getView().suggestions.map((suggestion) => suggestion.id),
  ).toEqual([id])
  expect(review.getView().diagnostic).not.toBe("")
  editor.update(
    () => {
      review.$decide(id, "reject")
    },
    { discrete: true },
  )
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Original text"))
  editor.dispose()
})

test("revoked suggestion permission cannot trap the viewer in suggestion mode", () => {
  const controller = createEditorReview()
  const editor = buildEditorFromExtensions(controller.extension)
  const review = controller.forEditor(editor)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  review.setSuggesting(true)
  review.setHost({
    viewer: null,
    visible: true,
    replyWhileReadonly: false,
    can: () => false,
  })
  review.setSuggesting(false)
  expect(review.getView().suggesting).toBe(false)
  editor.dispose()
})

test("readonly changes during policy evaluation invalidate the pending action", () => {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-readonly-fault-test",
      dependencies: [controller.extension],
      onError(error) {
        throw error
      },
    }),
  )

  const review = controller.forEditor(editor)
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => {
      editor.setEditable(false)

      return true
    },
  })
  expect(
    review.run(() => {
      review.$suggestInsert("Lost")
    }),
  ).toBe(false)
  expect(review.getView().diagnostic).not.toBe("")
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispose()
})

test("thread capacity failure rolls back before the next authorized change", () => {
  const controller = createEditorReview()
  const editor = buildEditorFromExtensions(controller.extension)
  const review = controller.forEditor(editor)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })

  const data = parseEditorReview({
    version: 1,
    threads: Array.from({ length: 256 }, (_, index) => ({
      id: `thread-${index}`,
      resolved: false,
      comments: [
        {
          id: `comment-${index}`,
          author: { id: "alice", name: "Alice" },
          text: "Existing",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    })),
  })

  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      $setState($getRoot(), editorReviewState, data)
      text.select(0, 8)
    },
    { discrete: true },
  )
  expect(
    review.run(() => {
      review.$createThread("Too many")
    }),
  ).toBe(false)
  expect(
    review.run(() => {
      review.$resolve("thread-0", true)
    }),
  ).toBe(true)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("Original")
    expect($nodesOfType(MarkNode)).toHaveLength(0)
  })
  expect(review.getView().data.threads).toHaveLength(256)
  editor.dispose()
})

test("review edits reject excessive document metadata without removing unrelated state", () => {
  const controller = createEditorReview()
  const editor = buildEditorFromExtensions(controller.extension)
  const review = controller.forEditor(editor)

  const unrelated = createState("large-unrelated", {
    parse(value) {
      return z.string().catch("").parse(value)
    },
  })

  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      $setState($getRoot(), unrelated, "x".repeat(1100000))
      text.selectEnd()
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
      review.$suggestInsert(" Lost")
    }),
  ).toBe(false)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("Original")
    expect($getState($getRoot(), unrelated).length).toBe(1100000)
  })
  editor.dispose()
})

test("comment validation keeps unrelated native code blocks and optional JSON fields", () => {
  const controller = createEditorReview()

  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "review-code-context",
      dependencies: [CodeExtension, controller.extension],
    }),
  )

  const review = controller.forEditor(editor)
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(text),
          $createCodeNode().append($createTextNode("const keep = true")),
        )
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
  expect(
    review.run(() => {
      review.$createThread("Keep code")
    }),
  ).toBe(true)
  editor.read(() =>
    expect($getRoot().getLastChild()!.getTextContent()).toBe(
      "const keep = true",
    ),
  )
  expect(review.getView().data.threads).toHaveLength(1)
  editor.dispose()
})

test("review actions reject nonfinite unrelated state without normalizing or losing it", () => {
  const scope = createEditorReview()
  const editor = buildEditorFromExtensions(scope.extension)
  const review = scope.forEditor(editor)

  const state = createState("review-nonfinite", {
    parse(value) {
      return z.number().catch(0).parse(value)
    },
  })

  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      $setState($getRoot(), state, Number.NaN)
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
  expect(
    review.run(() => {
      review.$createThread("Keep original")
    }),
  ).toBe(false)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("Original")
    expect(Number.isNaN($getState($getRoot(), state))).toBe(true)
  })
  editor.dispose()
})

test("malformed runtime review commands fail before content changes or coercion", () => {
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
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  let reads = 0

  const text = Object.defineProperty({}, "length", {
    get() {
      reads++

      return 1
    },
  })

  expect(
    review.run(() => {
      review.$suggestInsert(text)
    }),
  ).toBe(false)
  expect(reads).toBe(0)
  expect(
    review.run(() => {
      review.$decideAll("bogus")
    }),
  ).toBe(false)
  expect(
    review.run(() => {
      review.$suggestFormat("bogus")
    }),
  ).toBe(false)
  expect(() => review.setSuggesting("false")).toThrow()
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispose()
})

test("async review callbacks roll back and cannot publish late replies after host replacement", async () => {
  const scope = createEditorReview()
  const editor = buildEditorFromExtensions(scope.extension)
  const review = scope.forEditor(editor)
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, 8)
    },
    { discrete: true },
  )

  const host = {
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  }

  review.setHost(host)

  let finish: () => void = () => undefined

  const pause = new Promise<void>((resolve) => {
    finish = resolve
  })

  const pending: Promise<void>[] = []
  let denied = false

  async function lateReply() {
    const id = review.$createThread("Must roll back")
    await pause

    try {
      review.$reply(id, "Late reply")
    } catch {
      denied = true
    }
  }

  expect(
    review.run(() => {
      const task = lateReply()
      pending.push(task)

      return task
    }),
  ).toBe(false)
  review.setHost({ ...host, viewer: { id: "bob", name: "Bob" } })
  finish()
  expect(pending).toHaveLength(1)
  await Promise.all(pending)
  expect(denied).toBe(true)
  expect(review.getView().data.threads).toHaveLength(0)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  editor.dispose()
})

test("comment anchors reject token text without changing native token mode", () => {
  const scope = createEditorReview()
  const editor = buildEditorFromExtensions(scope.extension)
  const review = scope.forEditor(editor)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.update(
    () => {
      const text = $createTextNode("Token").setMode("token")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.select(0, 5)
    },
    { discrete: true },
  )
  expect(
    review.run(() => {
      review.$createThread("Unsupported")
    }),
  ).toBe(false)
  editor.read(() => {
    expect($getRoot().getTextContent()).toBe("Token")
    expect($getRoot().getAllTextNodes()[0].getMode()).toBe("token")
  })
  expect(review.getView().data.threads).toHaveLength(0)
  expect(review.getView().diagnostic.length).toBeGreaterThan(0)
  editor.dispose()
})

import { MarkNode } from "@lexical/mark"
import { createEditorReview } from "@yopem-ui/editor/review-extension"
import { expect, test } from "bun:test"
import {
  createEditor,
  FORMAT_TEXT_COMMAND,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
} from "lexical"

test("successive native insertion actions retain one author's suggestion and reject without loss", () => {
  const editor = createEditor({
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
        $createParagraphNode().append($createTextNode("Original")),
      )
      $getRoot().getAllTextNodes()[0].selectEnd()
    },
    { discrete: true },
  )
  let first = ""
  let second = ""
  editor.update(
    () => {
      first = review.$suggestInsert(" one")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      second = review.$suggestInsert(" two")
    },
    { discrete: true },
  )
  expect(second).toBe(first)
  const proposal = review.getView().suggestions[0]
  expect(Object.isFrozen(proposal)).toBe(true)
  expect(Reflect.set(proposal, "kind", "delete")).toBe(false)
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Original one two"))
  editor.update(() => review.$decide(first, "reject"), { discrete: true })
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Original"))
  cleanup()
})

test("deleting one's proposed text keeps original content and still requires target policy", () => {
  const editor = createEditor({
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
  })

  const controller = createEditorReview()
  const cleanup = controller.register(editor)
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
      $getRoot().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  let id = ""
  editor.update(
    () => {
      id = review.$suggestInsert("ab")
    },
    { discrete: true },
  )
  editor.update(
    () => {
      $getRoot().getAllTextNodes().at(-1)!.select(1, 2)
    },
    { discrete: true },
  )
  review.setHost({ ...host, can: (_action, target) => target !== id })
  expect(() =>
    editor.update(() => review.$suggestDelete(), { discrete: true }),
  ).toThrow()
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Originalab"))
  review.setHost(host)
  editor.update(
    () => {
      expect(review.$suggestDelete()).toBe(id)
    },
    { discrete: true },
  )
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Originala"))
  editor.update(() => review.$decide(id, "reject"), { discrete: true })
  editor
    .getEditorState()
    .read(() => expect($getRoot().getTextContent()).toBe("Original"))
  cleanup()
})

test("native caret format commands apply to future proposed text without changing earlier text", () => {
  const editor = createEditor({
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
  })

  const scope = createEditorReview()
  const cleanup = scope.register(editor)
  const review = scope.forEditor(editor)
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can: () => true,
  })
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  review.setSuggesting(true)
  let id = ""
  expect(
    review.run(() => {
      id = review.$suggestInsert(" A")
    }),
  ).toBe(true)
  editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
  expect(
    review.run(() => {
      review.$suggestInsert(" B")
    }),
  ).toBe(true)
  editor.read(() => {
    const nodes = $getRoot().getAllTextNodes()
    expect(
      nodes
        .find((node) => node.getTextContent().includes(" B"))
        ?.hasFormat("bold"),
    ).toBe(true)
    expect(
      nodes
        .find((node) => node.getTextContent().includes(" A"))
        ?.hasFormat("bold"),
    ).toBe(false)
  })
  expect(
    review.run(() => {
      review.$decide(id, "reject")
    }),
  ).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  cleanup()
})

test("adjacent same-author deletion actions retain their decision ID and target policy", () => {
  const editor = createEditor({
    nodes: [MarkNode],
    onError(error) {
      throw error
    },
  })

  const scope = createEditorReview()
  const cleanup = scope.register(editor)
  const review = scope.forEditor(editor)
  let target = ""
  let allowTarget = true
  review.setHost({
    viewer: { id: "alice", name: "Alice" },
    visible: true,
    replyWhileReadonly: false,
    can(action, id) {
      return action !== "suggest" || id !== target || allowTarget
    },
  })
  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().append($createParagraphNode().append(text))
      text.select(8, 7)
    },
    { discrete: true },
  )
  expect(
    review.run(() => {
      target = review.$suggestDelete()
    }),
  ).toBe(true)
  allowTarget = false
  expect(
    review.run(() => {
      $getRoot().getAllTextNodes()[0].select(7, 6)
      review.$suggestDelete()
    }),
  ).toBe(false)
  expect(review.getView().suggestions).toHaveLength(1)
  allowTarget = true
  let next = ""
  expect(
    review.run(() => {
      $getRoot().getAllTextNodes()[0].select(7, 6)
      next = review.$suggestDelete()
    }),
  ).toBe(true)
  expect(next).toBe(target)
  expect(review.getView().suggestions).toHaveLength(1)
  expect(
    review.run(() => {
      review.$decide(target, "reject")
    }),
  ).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe("Original"))
  cleanup()
})

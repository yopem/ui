import type { EditorBlockMenuOptions } from "@editor/block-menu"

import { createEditorBlockMenu } from "@editor/block-menu"
import { CodeExtension } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { ListExtension } from "@lexical/list"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
} from "lexical"

function setup(options: EditorBlockMenuOptions = {}) {
  const controller = createEditorBlockMenu(options)

  const editor = buildEditorFromExtensions({
    name: "test/block-menu-comment",
    dependencies: [
      RichTextExtension,
      HistoryExtension,
      ListExtension,
      CodeExtension,
      controller.extension,
    ],
  })

  editor.update(
    () => {
      const first = $createTextNode("First block")
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(first),
          $createParagraphNode().append($createTextNode("Second block")),
        )
      first.select(0, 5)
    },
    { discrete: true },
  )

  return { controller, editor }
}

test("Add comment requires a configured callback and host authorization", async () => {
  let calls = 0
  const withoutCallback = setup({ authorizeAction: () => true })

  expect(withoutCallback.controller.captureFromSelection()).toBe(true)
  expect(withoutCallback.controller.getSnapshot().canAddComment).toBe(false)
  expect(await withoutCallback.controller.run("add-comment")).toBe(false)
  withoutCallback.editor.dispose()

  const withoutPolicy = setup({
    onAddComment() {
      calls++
    },
  })

  expect(withoutPolicy.controller.captureFromSelection()).toBe(true)
  expect(withoutPolicy.controller.getSnapshot().canAddComment).toBe(false)
  expect(await withoutPolicy.controller.run("add-comment")).toBe(false)
  expect(calls).toBe(0)
  withoutPolicy.editor.dispose()
})

test("Add comment requires literal true from the host policy", async () => {
  for (const result of [
    false,
    undefined,
    1,
    "true",
    {},
    Promise.resolve(true),
  ]) {
    let calls = 0

    const options: EditorBlockMenuOptions = {
      authorizeAction: () => true,
      onAddComment() {
        calls++
      },
    }

    Reflect.set(options, "authorizeAction", () => result)
    const { controller, editor } = setup(options)

    expect(controller.captureFromSelection()).toBe(true)
    expect(await controller.run("add-comment")).toBe(false)
    expect(calls).toBe(0)
    editor.dispose()
  }
})

test("authorized Add comment receives the frozen captured block context", async () => {
  let authorizedContext: unknown
  let receivedContext: unknown
  let authorizedAction = ""

  const { controller, editor } = setup({
    authorizeAction(action, context) {
      authorizedAction = action
      authorizedContext = context

      return true
    },
    onAddComment(context) {
      receivedContext = context
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  const target = controller.getSnapshot().target
  expect(await controller.run("add-comment")).toBe(true)
  expect(authorizedAction).toBe("add-comment")
  expect(receivedContext).toBe(target)
  expect(receivedContext).toBe(authorizedContext)
  expect(Object.isFrozen(receivedContext)).toBe(true)
  expect(target?.blockText).toBe("First block")
  expect(target?.selectedText).toBe("First")
  editor.dispose()
})

test("content changes expire the Add comment target", async () => {
  let calls = 0

  const { controller, editor } = setup({
    authorizeAction: () => true,
    onAddComment() {
      calls++
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  editor.update(
    () => {
      const block = $getRoot().getFirstChildOrThrow()

      if (!$isElementNode(block)) throw new Error("Expected paragraph")
      block.clear().append($createTextNode("Replacement"))
    },
    { discrete: true },
  )

  expect(await controller.run("add-comment")).toBe(false)
  expect(calls).toBe(0)
  expect(
    editor.read(() =>
      $getRoot()
        .getChildren()
        .map((node) => node.getTextContent()),
    ),
  ).toEqual(["Replacement", "Second block"])
  editor.dispose()
})

test("selection changes fail closed without restoring the captured range", async () => {
  let calls = 0

  const { controller, editor } = setup({
    authorizeAction: () => true,
    onAddComment() {
      calls++
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  editor.update(
    () => {
      const block = $getRoot().getLastChildOrThrow()

      if (!$isElementNode(block)) throw new Error("Expected paragraph")
      const text = block.getFirstChildOrThrow()

      if (!$isTextNode(text)) throw new Error("Expected text")
      text.select(0, 6)
    },
    { discrete: true },
  )

  expect(await controller.run("add-comment")).toBe(false)
  expect(calls).toBe(0)
  controller.close()
  editor.read(() => {
    const selection = $getSelection()
    expect($isRangeSelection(selection)).toBe(true)

    if (!$isRangeSelection(selection))
      throw new Error("Expected range selection")
    expect(selection.getTextContent()).toBe("Second")
  })
  editor.dispose()
})

test("selection changes during authorization invalidate Add comment", async () => {
  let changeSelection = () => undefined
  let calls = 0

  const { controller, editor } = setup({
    authorizeAction() {
      changeSelection()

      return true
    },
    onAddComment() {
      calls++
    },
  })

  changeSelection = () => {
    editor.update(
      () => {
        const block = $getRoot().getLastChildOrThrow()

        if (!$isElementNode(block)) throw new Error("Expected paragraph")
        const text = block.getFirstChildOrThrow()

        if (!$isTextNode(text)) throw new Error("Expected text")
        text.select(0, 6)
      },
      { discrete: true },
    )

    return undefined
  }

  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("add-comment")).toBe(false)
  expect(calls).toBe(0)
  controller.close()
  editor.read(() => {
    const selection = $getSelection()
    expect($isRangeSelection(selection)).toBe(true)

    if (!$isRangeSelection(selection))
      throw new Error("Expected range selection")
    expect(selection.getTextContent()).toBe("Second")
  })
  editor.dispose()
})

test("Add comment callback failures return false", async () => {
  function throwComment() {
    throw new Error("Host comment failed")
  }

  function rejectComment() {
    return Promise.reject(new Error("Host comment failed"))
  }

  for (const onAddComment of [throwComment, rejectComment]) {
    const { controller, editor } = setup({
      authorizeAction: () => true,
      onAddComment,
    })

    expect(controller.captureFromSelection()).toBe(true)
    expect(await controller.run("add-comment")).toBe(false)
    editor.dispose()
  }
})

test("existing copy action remains behind its host policy", async () => {
  const actions: string[] = []

  const { controller, editor } = setup({
    authorizeAction(action) {
      actions.push(action)

      return false
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("copy")).toBe(false)
  expect(actions).toEqual(["copy"])
  editor.dispose()
})

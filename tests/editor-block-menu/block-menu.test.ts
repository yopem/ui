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
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical"

function setup(options: EditorBlockMenuOptions = {}) {
  const controller = createEditorBlockMenu(options)

  const editor = buildEditorFromExtensions({
    name: "test/block-menu",
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

test("capture and close preserve native selected text and selection bookmark", () => {
  const { controller, editor } = setup()
  expect(controller.captureFromSelection()).toBe(true)
  expect(controller.getSnapshot().target?.selectedText).toBe("First")
  editor.update(
    () => {
      const block = $getRoot().getFirstChildOrThrow()

      if (!$isElementNode(block)) throw new Error("Expected element block")
      const first = block.getFirstChildOrThrow()

      if (!$isTextNode(first)) throw new Error("Expected text node")
      first.select(6, 11)
    },
    { discrete: true },
  )
  controller.close()
  editor.read(() => {
    const selection = $getSelection()
    expect($isRangeSelection(selection)).toBe(true)

    if (!$isRangeSelection(selection))
      throw new Error("Expected range selection")
    expect(selection.getTextContent()).toBe("First")
  })
  editor.dispose()
})

test("block conversion targets captured block and keeps its content", async () => {
  const { controller, editor } = setup()
  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("heading-2")).toBe(true)
  editor.read(() => {
    const first = $getRoot().getFirstChildOrThrow()
    expect(first.getType()).toBe("heading")
    expect(first.getTextContent()).toBe("First block")
    expect($getRoot().getLastChildOrThrow().getType()).toBe("paragraph")
  })
  editor.dispose()
})

test("host replacement expires target and bookmark before any action", async () => {
  const { controller, editor } = setup()
  expect(controller.captureFromSelection()).toBe(true)
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("Host replacement")),
        )
    },
    { discrete: true },
  )
  expect(controller.getSnapshot().open).toBe(false)
  expect(await controller.run("delete")).toBe(false)
  expect(editor.read(() => $getRoot().getTextContent())).toBe(
    "Host replacement",
  )
  editor.dispose()
})

test("authorization rejects every result except literal true", async () => {
  for (const value of [
    false,
    undefined,
    1,
    "true",
    {},
    Promise.resolve(true),
  ]) {
    const options: EditorBlockMenuOptions = { authorizeAction: () => true }
    Reflect.set(options, "authorizeAction", () => value)
    const { controller, editor } = setup(options)
    const before = editor.getEditorState().toJSON()
    expect(controller.captureFromSelection()).toBe(true)
    expect(await controller.run("delete")).toBe(false)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    editor.dispose()
  }
})

test("document policy rejects duplicate and delete without changing JSON", async () => {
  for (const action of ["duplicate", "delete"] as const) {
    const { controller, editor } = setup({ validateDocument: () => false })
    const before = editor.getEditorState().toJSON()
    expect(controller.captureFromSelection()).toBe(true)
    expect(await controller.run(action)).toBe(false)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    editor.dispose()
  }
})

test("duplicate and delete are history-safe and read-only mutation is denied", async () => {
  const { controller, editor } = setup()
  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("duplicate")).toBe(true)
  expect(editor.read(() => $getRoot().getChildrenSize())).toBe(3)
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  await Promise.resolve()
  expect(editor.read(() => $getRoot().getChildrenSize())).toBe(2)
  editor.dispatchCommand(REDO_COMMAND, undefined)
  await Promise.resolve()
  expect(editor.read(() => $getRoot().getChildrenSize())).toBe(3)
  editor.setEditable(false)
  const before = editor.getEditorState().toJSON()
  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("delete")).toBe(false)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  editor.dispose()
})

test("optional host actions require supplied callbacks and receive selected text", async () => {
  let received = ""

  const { controller, editor } = setup({
    onAskAI(context) {
      received = context.selectedText
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  expect(controller.getSnapshot().canAskAI).toBe(true)
  expect(controller.getSnapshot().canCodeDrawing).toBe(false)
  expect(await controller.run("ask-ai")).toBe(true)
  expect(received).toBe("First")
  expect(await controller.run("code-drawing")).toBe(false)
  editor.dispose()
})

test("pending document changes during authorization invalidate every menu target", async () => {
  for (const action of [
    "delete",
    "duplicate",
    "heading-2",
    "ask-ai",
    "code-drawing",
  ] as const) {
    let mutate = () => undefined
    let hostCalls = 0

    const { controller, editor } = setup({
      authorizeAction() {
        mutate()

        return true
      },
      onAskAI() {
        hostCalls++
      },
      onCodeDrawing() {
        hostCalls++
      },
    })

    mutate = () => {
      editor.update(() => {
        const block = $getRoot().getFirstChildOrThrow()

        if (!$isElementNode(block)) throw new Error("Expected paragraph")
        block.clear().append($createTextNode("Policy replacement"))
      })

      return undefined
    }

    expect(controller.captureFromSelection()).toBe(true)
    expect(await controller.run(action)).toBe(false)
    expect(
      editor.read(() => $getRoot().getFirstChildOrThrow().getTextContent()),
    ).toBe("Policy replacement")
    expect(editor.read(() => $getRoot().getFirstChildOrThrow().getType())).toBe(
      "paragraph",
    )
    expect(hostCalls).toBe(0)
    editor.dispose()
  }
})

test("authorization cannot redirect the captured readonly block context", async () => {
  let otherKey = ""

  const { controller, editor } = setup({
    authorizeAction(_action, context) {
      expect(Reflect.set(context, "blockKey", otherKey)).toBe(false)

      return true
    },
  })

  otherKey = editor.read(() => $getRoot().getLastChildOrThrow().getKey())
  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("heading-2")).toBe(true)
  editor.read(() => {
    expect($getRoot().getFirstChildOrThrow().getType()).toBe("heading")
    expect($getRoot().getLastChildOrThrow().getType()).toBe("paragraph")
  })
  editor.dispose()
})

test("rejected asynchronous host callbacks fail closed", async () => {
  for (const action of ["ask-ai", "code-drawing"] as const) {
    function rejectHostAction() {
      return Promise.reject(new Error("Host rejected action"))
    }

    const { controller, editor } = setup({
      onAskAI: rejectHostAction,
      onCodeDrawing: rejectHostAction,
    })

    const before = editor.getEditorState().toJSON()
    expect(controller.captureFromSelection()).toBe(true)
    expect(await controller.run(action)).toBe(false)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    editor.dispose()
  }
})

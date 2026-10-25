import type {
  EditorBlockMenuActionPreparation,
  EditorBlockMenuOptions,
} from "@editor/block-menu"

import { createEditorBlockMenu } from "@editor/block-menu"
import { $isValidBookmarkPoint } from "@editor/selection-bookmark"
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
    name: "test/block-menu-action-preparation",
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

function selectSecondBlock(editor: ReturnType<typeof setup>["editor"]) {
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
}

function selectedText(editor: ReturnType<typeof setup>["editor"]) {
  return editor.read(() => {
    const selection = $getSelection()

    return $isRangeSelection(selection) ? selection.getTextContent() : null
  })
}

test("prepared host action restores captured range after menu close and selection change", async () => {
  let preparation: EditorBlockMenuActionPreparation | undefined

  const { controller, editor } = setup({
    authorizeAction: (action) => action === "ask-ai",
    onAskAI(_context, actionPreparation) {
      preparation = actionPreparation
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("ask-ai")).toBe(true)
  expect(preparation).toBeDefined()

  if (!preparation) throw new Error("Expected action preparation")
  controller.close()
  selectSecondBlock(editor)
  expect(selectedText(editor)).toBe("Second")
  expect(preparation.getSnapshot()).toBe(true)
  expect(preparation.restoreSelection()).toBe(true)
  expect(selectedText(editor)).toBe("First")
  preparation.dispose()
  editor.dispose()
})

test("prepared host action rejects content changes and pending dirty roots", async () => {
  let preparation: EditorBlockMenuActionPreparation | undefined
  let changeDocument = false

  const setupResult = setup({
    authorizeAction() {
      if (changeDocument)
        editor.update(() => {
          const block = $getRoot().getFirstChildOrThrow()

          if (!$isElementNode(block)) throw new Error("Expected paragraph")
          block.clear().append($createTextNode("Pending replacement"))
        })

      return true
    },
    onAskAI(_context, actionPreparation) {
      preparation = actionPreparation
    },
  })

  const editor = setupResult.editor
  expect(setupResult.controller.captureFromSelection()).toBe(true)
  expect(await setupResult.controller.run("ask-ai")).toBe(true)
  expect(preparation).toBeDefined()

  if (!preparation) throw new Error("Expected action preparation")
  changeDocument = true
  expect(preparation.restoreSelection()).toBe(false)
  expect(preparation.getSnapshot()).toBe(false)
  setupResult.editor.dispose()
})

test("reentrant authorization cannot redirect a prepared action to a new target", async () => {
  let preparation: EditorBlockMenuActionPreparation | undefined
  let recapture = false

  const setupResult = setup({
    authorizeAction() {
      if (recapture) controller.captureFromSelection()

      return true
    },
    onAskAI(_context, actionPreparation) {
      preparation = actionPreparation
    },
  })

  const controller = setupResult.controller
  expect(setupResult.controller.captureFromSelection()).toBe(true)
  expect(await setupResult.controller.run("ask-ai")).toBe(true)
  expect(preparation).toBeDefined()

  if (!preparation) throw new Error("Expected action preparation")
  setupResult.controller.close()
  recapture = true
  expect(preparation.refresh()).toBe(false)
  expect(preparation.restoreSelection()).toBe(false)
  expect(preparation.getSnapshot()).toBe(false)
  setupResult.editor.dispose()
})

test("read-only transition permanently invalidates prepared selection", async () => {
  let preparation: EditorBlockMenuActionPreparation | undefined

  const { controller, editor } = setup({
    authorizeAction: () => true,
    onCodeDrawing(_context, actionPreparation) {
      preparation = actionPreparation
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("code-drawing")).toBe(true)
  expect(preparation).toBeDefined()

  if (!preparation) throw new Error("Expected action preparation")
  editor.setEditable(false)
  expect(preparation.getSnapshot()).toBe(false)
  editor.setEditable(true)
  expect(preparation.refresh()).toBe(false)
  expect(preparation.restoreSelection()).toBe(false)
  editor.dispose()
})

test("disposed preparation cannot restore or revive its captured target", async () => {
  let preparation: EditorBlockMenuActionPreparation | undefined

  const { controller, editor } = setup({
    authorizeAction: () => true,
    onAskAI(_context, actionPreparation) {
      preparation = actionPreparation
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("ask-ai")).toBe(true)
  expect(preparation).toBeDefined()

  if (!preparation) throw new Error("Expected action preparation")
  preparation.dispose()
  controller.close()
  selectSecondBlock(editor)
  expect(preparation.refresh()).toBe(false)
  expect(preparation.restoreSelection()).toBe(false)
  expect(preparation.getSnapshot()).toBe(false)
  editor.dispose()
})

test("prepared range restoration rechecks literal-true host policy", async () => {
  let preparation: EditorBlockMenuActionPreparation | undefined
  let allowed = true

  const { controller, editor } = setup({
    authorizeAction: () => allowed,
    onAskAI(_context, actionPreparation) {
      preparation = actionPreparation
    },
  })

  expect(controller.captureFromSelection()).toBe(true)
  expect(await controller.run("ask-ai")).toBe(true)
  expect(preparation).toBeDefined()

  if (!preparation) throw new Error("Expected action preparation")
  allowed = false
  expect(preparation.refresh()).toBe(false)
  expect(preparation.restoreSelection()).toBe(false)
  allowed = true
  expect(preparation.refresh()).toBe(true)
  expect(preparation.restoreSelection()).toBe(true)
  preparation.dispose()
  editor.dispose()
})

test("saved range point validation rejects offsets outside attached node bounds", () => {
  const { editor } = setup()

  editor.read(() => {
    const block = $getRoot().getFirstChildOrThrow()

    if (!$isElementNode(block)) throw new Error("Expected paragraph")
    const text = block.getFirstChildOrThrow()

    if (!$isTextNode(text)) throw new Error("Expected text")
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) throw new Error("Expected range")
    expect($isValidBookmarkPoint(selection.anchor)).toBe(true)
    expect(
      $isValidBookmarkPoint({
        ...selection.anchor,
        offset: text.getTextContentSize() + 1,
      }),
    ).toBe(false)
  })

  editor.dispose()
})

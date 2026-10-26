import { createEditorBlockSelection } from "@editor/block-selection"
import { CodeExtension, $createCodeNode } from "@lexical/code"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  configExtension,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical"

function setup(options: Parameters<typeof createEditorBlockSelection>[0] = {}) {
  const controller = createEditorBlockSelection(options)

  const editor = buildEditorFromExtensions({
    name: "test/block-selection",
    dependencies: [
      RichTextExtension,
      configExtension(HistoryExtension, { disabled: false }),
      CodeExtension,
      controller.extension,
    ],
  })

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(
            $createTextNode("Alpha").toggleFormat("bold"),
          ),
          $createCodeNode("javascript").append($createTextNode("const n = 1")),
          $createParagraphNode().append($createTextNode("Gamma")),
          $createParagraphNode().append($createTextNode("Delta")),
        )
      $getRoot().getFirstChildOrThrow().selectEnd()
    },
    { discrete: true },
  )
  const keys = editor.getEditorState().read(() => $getRoot().getChildrenKeys())

  function order() {
    return editor.getEditorState().read(() => $getRoot().getChildrenKeys())
  }

  return { controller, editor, keys, order }
}

test("selection is top-level, ordered, contiguous or additive and never guesses stale keys", () => {
  const { controller, editor, keys } = setup()
  controller.select(keys[1])
  controller.select(keys[3], { shift: true })
  expect(controller.getSnapshot().selected).toEqual(keys.slice(1))
  controller.select(keys[2], { toggle: true })
  expect(controller.getSnapshot().selected).toEqual([keys[1], keys[3]])
  expect(controller.select("missing")).toBe(false)
  expect(controller.getSnapshot().error).not.toBeNull()
  controller.clear()
  expect(controller.getSnapshot().mode).toBe(false)
  editor.dispose()
})

test("reorder preserves native keys and rich JSON; one undo and redo restore order", async () => {
  const { controller, editor, keys, order } = setup()
  const before = editor.getEditorState().toJSON().root.children
  controller.select(keys[1])
  expect(controller.move("up")).toBe(true)
  expect(order()).toEqual([keys[1], keys[0], keys[2], keys[3]])
  expect(editor.getEditorState().toJSON().root.children[0]).toEqual(before[1])
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  await Promise.resolve()
  expect(order()).toEqual(keys)
  editor.dispatchCommand(REDO_COMMAND, undefined)
  await Promise.resolve()
  expect(order()[0]).toBe(keys[1])
  editor.dispose()
})

test("discontiguous move preserves groups; boundary and stale drops preserve content", () => {
  const { controller, editor, keys, order } = setup()
  controller.select(keys[0])
  expect(controller.move("up")).toBe(false)
  controller.select(keys[2], { toggle: true })
  expect(controller.move("down")).toBe(true)
  expect(order()).toEqual([keys[1], keys[0], keys[3], keys[2]])
  controller.select(keys[0])
  controller.beginDrag(keys[0])
  editor.update(
    () => {
      $getRoot().getLastChildOrThrow().selectEnd()
    },
    { discrete: true },
  )
  controller.cancelDrag()
  expect(controller.drop(keys[1], "before")).toBe(false)
  editor.dispose()
})

test("duplicate and delete use native complete subtrees; final delete leaves paragraph", () => {
  const { controller, editor, keys } = setup()
  const code = editor.getEditorState().toJSON().root.children[1]
  controller.select(keys[1])
  expect(controller.duplicate()).toBe(true)
  expect(editor.getEditorState().toJSON().root.children[2]).toEqual(code)
  controller.selectAll()
  expect(controller.remove()).toBe(true)
  expect(editor.getEditorState().toJSON().root.children).toHaveLength(1)
  editor.getEditorState().read(() => {
    expect($getRoot().getFirstChildOrThrow().getType()).toBe("paragraph")
    expect($isRangeSelection($getSelection())).toBe(true)
  })
  editor.dispose()
})

test("external mutation, readonly and disposal invalidate targets; readonly allows view selection", async () => {
  const { controller, editor, keys } = setup()
  controller.select(keys[0])
  editor.update(
    () => {
      $getRoot().getLastChildOrThrow().remove()
    },
    { discrete: true },
  )
  expect(controller.getSnapshot().selected).toEqual([])
  controller.select(keys[0])
  editor.setEditable(false)
  expect(controller.getSnapshot().selected).toEqual([])
  controller.select(keys[0])
  expect(controller.getSnapshot().selected).toEqual([keys[0]])
  await Promise.resolve()
  editor.read(() => {
    const selection = $getSelection()
    expect($isNodeSelection(selection)).toBe(true)

    if (!$isNodeSelection(selection))
      throw new Error("Expected block selection")
    expect(selection.has(keys[0])).toBe(true)
  })
  expect(controller.getSnapshot().selected).toEqual([keys[0]])
  expect(controller.remove()).toBe(false)
  expect(controller.duplicate()).toBe(false)
  expect(controller.move("down")).toBe(false)
  editor.dispose()
  expect(controller.getSnapshot().selected).toEqual([])
})

test("validator and bounds rejection preserve original JSON and report error", () => {
  const { controller, editor, keys } = setup({
    validateDocument() {
      return false
    },
  })

  const before = editor.getEditorState().toJSON()
  controller.select(keys[0])
  expect(controller.move("down")).toBe(false)
  expect(controller.duplicate()).toBe(false)
  expect(controller.remove()).toBe(false)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(controller.getSnapshot().error).not.toBeNull()
  editor.dispose()
})

test("drag commits once and refuses concurrent document changes", () => {
  const { controller, editor, keys, order } = setup()
  controller.beginDrag(keys[0])
  expect(controller.drop(keys[2], "after")).toBe(true)
  expect(order()).toEqual([keys[1], keys[2], keys[0], keys[3]])
  controller.beginDrag(keys[0])
  editor.update(
    () => {
      $getRoot().getLastChildOrThrow().remove()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  expect(controller.drop(keys[1], "before")).toBe(false)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  editor.dispose()
})

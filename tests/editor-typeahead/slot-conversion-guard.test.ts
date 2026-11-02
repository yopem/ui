import { EditorBlocksExtension } from "@editor/blocks-extension"
import { $createCalloutNode } from "@editor/blocks-model"
import { EditorCodeExtension } from "@editor/code-extension"
import { createEditorTypeahead } from "@editor/typeahead"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HistoryExtension } from "@lexical/history"
import {
  $createListItemNode,
  $createListNode,
  ListExtension,
} from "@lexical/list"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isTextNode,
  $setSlot,
  configExtension,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"

function setup() {
  const controller = createEditorTypeahead()

  const editor = buildEditorFromExtensions({
    name: "test/typeahead-slot-conversion",
    dependencies: [
      RichTextExtension,
      configExtension(HistoryExtension, { disabled: false }),
      ListExtension,
      EditorCodeExtension,
      EditorBlocksExtension,
      controller.extension,
    ],
  })

  return { controller, editor }
}

for (const command of ["h2", "code", "bullet"] as const) {
  test(`slash ${command} preserves a slot on its paragraph`, () => {
    const { controller, editor } = setup()
    editor.update(
      () => {
        const query = $createTextNode("/")
        const paragraph = $createParagraphNode().append(query)
        $setSlot(
          paragraph,
          "note",
          $createParagraphNode().append($createTextNode("private")),
        )
        $getRoot().clear().append(paragraph)
        query.selectEnd()
      },
      { discrete: true },
    )
    const before = editor.getEditorState().toJSON()
    const selection = editor.read(() => $getSelection()?.clone())
    expect(controller.choose(command)).toBe(false)
    expect(editor.getEditorState().toJSON()).toEqual(before)
    expect(editor.read(() => selection?.is($getSelection()))).toBe(true)
    editor.dispose()
  })
}

test("rejected slash conversion preserves undo and redo history", async () => {
  const { controller, editor } = setup()
  editor.update(
    () => {
      const paragraph = $createParagraphNode().append($createTextNode("before"))
      $setSlot(
        paragraph,
        "note",
        $createParagraphNode().append($createTextNode("private")),
      )
      $getRoot().clear().append(paragraph)
    },
    { discrete: true },
  )
  const previous = editor.getEditorState().toJSON()
  editor.update(
    () => {
      const query = $getRoot().getFirstDescendant()

      if (!$isTextNode(query)) throw new Error("Expected query text")
      query.setTextContent("/")
      query.selectEnd()
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )
  const current = editor.getEditorState().toJSON()
  expect(controller.choose("h2")).toBe(false)
  expect(editor.getEditorState().toJSON()).toEqual(current)
  editor.dispatchCommand(UNDO_COMMAND, undefined)
  await Promise.resolve()
  expect(editor.getEditorState().toJSON()).toEqual(previous)
  editor.dispatchCommand(REDO_COMMAND, undefined)
  await Promise.resolve()
  expect(editor.getEditorState().toJSON()).toEqual(current)
  editor.dispose()
})

test("slash conversion rejects a slot on another item in the affected list", () => {
  const { controller, editor } = setup()
  editor.update(
    () => {
      const query = $createTextNode("/")
      const selected = $createListItemNode().append(query)
      const sibling = $createListItemNode().append($createTextNode("sibling"))
      $setSlot(
        sibling,
        "note",
        $createParagraphNode().append($createTextNode("private")),
      )
      $getRoot()
        .clear()
        .append($createListNode("bullet").append(selected, sibling))
      query.selectEnd()
    },
    { discrete: true },
  )
  const before = editor.getEditorState().toJSON()
  const selection = editor.read(() => $getSelection()?.clone())
  expect(controller.choose("h2")).toBe(false)
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(editor.read(() => selection?.is($getSelection()))).toBe(true)
  editor.dispose()
})

for (const command of ["h2", "bullet"] as const) {
  test(`slash ${command} works inside an ordinary callout`, () => {
    const { controller, editor } = setup()
    editor.update(
      () => {
        const query = $createTextNode("/")
        const paragraph = $createParagraphNode().append(query)
        $getRoot().clear().append($createCalloutNode().append(paragraph))
        query.selectEnd()
      },
      { discrete: true },
    )
    expect(controller.choose(command)).toBe(true)
    editor.read(() => {
      const callout = $getRoot().getFirstChild()
      expect(callout?.getType()).toBe("editor-callout")
      expect(callout?.getTextContent()).toBe("")
    })
    editor.dispose()
  })
}

test("slash conversion works in an ordinary list", () => {
  const { controller, editor } = setup()
  editor.update(
    () => {
      const query = $createTextNode("/")
      $getRoot()
        .clear()
        .append(
          $createListNode("bullet").append($createListItemNode().append(query)),
        )
      query.selectEnd()
    },
    { discrete: true },
  )
  expect(controller.choose("h2")).toBe(true)
  expect(editor.read(() => $getRoot().getFirstChild()?.getType())).toBe(
    "heading",
  )
  editor.dispose()
})

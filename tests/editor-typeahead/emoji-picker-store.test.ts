import { createEditorEmojiHistory } from "@editor/emoji-history"
import { createEditorEmojiPicker } from "@editor/emoji-picker-store"
import { buildEditorFromExtensions } from "@lexical/extension"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"

const inventory = [
  {
    id: "smile",
    emoji: "😀",
    label: "Smile",
    category: "faces",
    aliases: ["grin"],
  },
  {
    id: "wave",
    emoji: "👋🏽",
    label: "Wave",
    category: "people",
    aliases: ["hello"],
  },
]

function setup() {
  const editor = buildEditorFromExtensions({
    name: "test/emoji-picker",
    dependencies: [RichTextExtension],
  })

  editor.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode("Hello ")))
      $getRoot().selectEnd()
    },
    { discrete: true },
  )
  const history = createEditorEmojiHistory()
  const picker = createEditorEmojiPicker(editor, { inventory, history })
  let notifications = 0

  const unsubscribe = picker.subscribe(() => {
    notifications++
  })

  return {
    editor,
    picker,
    history,
    unsubscribe,
    getNotifications(this: void) {
      return notifications
    },
  }
}

test("picker snapshots are stable; search, category, history and cancellation are observable", () => {
  const { editor, picker, unsubscribe, getNotifications } = setup()
  expect(picker.getSnapshot()).toBe(picker.getSnapshot())
  picker.setOpen(true)
  expect(picker.getSnapshot().valid).toBe(true)
  picker.highlight(picker.getSnapshot().items[0] ?? null)
  expect(picker.getSnapshot().preview?.id).toBe("smile")
  picker.highlight({ id: "spoof", emoji: "😀", label: "Spoof", aliases: [] })
  expect(picker.getSnapshot().preview).toBeNull()
  picker.highlight(picker.getSnapshot().items[0] ?? null)
  picker.setQuery("hello")
  expect(picker.getSnapshot().preview).toBeNull()
  expect(picker.getSnapshot().items.map((item) => item.id)).toEqual(["wave"])
  picker.setCategory("category:faces")
  expect(picker.getSnapshot().items).toHaveLength(0)
  picker.setOpen(false)
  expect(picker.getSnapshot().valid).toBe(false)
  expect(picker.insert("wave")).toBe(false)
  expect(getNotifications()).toBeGreaterThan(0)
  unsubscribe()
  editor.dispose()
})

test("picker rejects stale, unknown, filtered and readonly insertions and clears on last unsubscribe", () => {
  const { editor, picker, unsubscribe } = setup()
  expect(picker.insert("smile")).toBe(false)
  picker.setOpen(true)
  expect(picker.insert("unknown")).toBe(false)
  picker.setQuery("Wave")
  expect(picker.insert("smile")).toBe(false)
  editor.update(
    () => {
      $getRoot().getFirstChildOrThrow().selectEnd()
      $getRoot().append($createParagraphNode())
    },
    { discrete: true },
  )
  expect(picker.getSnapshot().valid).toBe(false)
  expect(picker.insert("wave")).toBe(false)
  picker.setOpen(false)
  picker.setOpen(true)
  editor.setEditable(false)
  expect(picker.getSnapshot().open).toBe(false)
  expect(picker.insert("wave")).toBe(false)
  editor.setEditable(true)
  picker.setOpen(true)
  unsubscribe()
  expect(picker.getSnapshot().valid).toBe(false)
  expect(picker.getSnapshot().open).toBe(false)
  editor.dispose()
})

test("picker inserts Unicode only at captured selection; records once and returns editor focus", async () => {
  const { editor, picker, history, unsubscribe } = setup()
  picker.setOpen(true)
  expect(picker.insert("wave")).toBe(true)
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(editor.getEditorState().read(() => $getRoot().getTextContent())).toBe(
    "Hello 👋🏽",
  )
  expect(history.getSnapshot()[0]?.emoji.id).toBe("wave")
  expect(picker.getSnapshot().open).toBe(false)
  expect(picker.insert("wave")).toBe(false)
  picker.setCategory("frequent")
  expect(picker.getSnapshot().items.map((item) => item.id)).toEqual(["wave"])
  picker.clearHistory()
  expect(picker.getSnapshot().items).toHaveLength(0)
  unsubscribe()
  editor.dispose()
})

import { createEditorBlockMenu } from "@editor/block-menu"
import { EditorCodeExtension } from "@editor/code-extension"
import { buildEditorFromExtensions } from "@lexical/extension"
import { $createLinkNode, LinkExtension } from "@lexical/link"
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
  $setSlot,
} from "lexical"

function setup() {
  const controller = createEditorBlockMenu()

  const editor = buildEditorFromExtensions({
    name: "test/menu-conversion-slot-guards",
    dependencies: [
      RichTextExtension,
      ListExtension,
      LinkExtension,
      EditorCodeExtension,
      controller.extension,
    ],
  })

  return { controller, editor }
}

function selection() {
  return $getSelection()?.clone() ?? null
}

for (const action of ["code", "heading-2"] as const) {
  test(`menu ${action} handles a retained inline slot host`, async () => {
    const { controller, editor } = setup()
    editor.update(
      () => {
        const text = $createTextNode("body")
        const link = $createLinkNode("https://example.com").append(text)
        $setSlot(
          link,
          "note",
          $createParagraphNode().append($createTextNode("private")),
        )
        $getRoot().clear().append($createParagraphNode().append(link))
        text.select(1, 3)
      },
      { discrete: true },
    )
    expect(controller.captureFromSelection()).toBe(true)
    const before = editor.getEditorState().toJSON()
    const beforeSelection = editor.read(selection)
    expect(await controller.run(action)).toBe(action === "heading-2")

    if (action === "code") {
      expect(editor.getEditorState().toJSON()).toEqual(before)
      expect(editor.read(() => beforeSelection?.is($getSelection()))).toBe(true)
    } else
      expect(JSON.stringify(editor.getEditorState().toJSON())).toContain(
        "private",
      )
    editor.dispose()
  })
}

for (const action of ["indent", "outdent"] as const) {
  for (const slotted of [true, false]) {
    test(`menu ${action} ${slotted ? "rejects a removable slot wrapper" : "works without slots"}`, async () => {
      const { controller, editor } = setup()
      editor.update(
        () => {
          const selected = $createListItemNode().append(
            $createTextNode("selected"),
          )

          const inner =
            action === "outdent"
              ? selected
              : $createListItemNode().append($createTextNode("next"))

          const wrapper = $createListItemNode().append(
            $createListNode("bullet").append(inner),
          )

          if (slotted)
            $setSlot(
              wrapper,
              "note",
              $createParagraphNode().append($createTextNode("private")),
            )

          const list =
            action === "outdent"
              ? $createListNode("bullet").append(wrapper)
              : $createListNode("bullet").append(
                  $createListItemNode().append(
                    $createListNode("bullet").append(
                      $createListItemNode().append($createTextNode("previous")),
                    ),
                  ),
                  selected,
                  wrapper,
                )

          $getRoot().clear().append(list)
          selected.selectStart()
        },
        { discrete: true },
      )
      expect(controller.captureFromSelection()).toBe(true)
      const before = editor.getEditorState().toJSON()
      const beforeSelection = editor.read(selection)
      expect(await controller.run(action)).toBe(!slotted)

      if (slotted) {
        expect(editor.getEditorState().toJSON()).toEqual(before)
        expect(editor.read(() => beforeSelection?.is($getSelection()))).toBe(
          true,
        )
      } else expect(editor.getEditorState().toJSON()).not.toEqual(before)
      editor.dispose()
    })
  }
}

test("reentrant menu action does not mutate after a false result", async () => {
  const { controller, editor } = setup()
  editor.update(
    () => {
      const paragraph = $createParagraphNode().append($createTextNode("body"))
      $getRoot().clear().append(paragraph)
      paragraph.selectStart()
    },
    { discrete: true },
  )
  expect(controller.captureFromSelection()).toBe(true)
  const before = editor.getEditorState().toJSON()
  const beforeSelection = editor.read(selection)
  let result: Promise<boolean> | undefined
  editor.update(
    () => {
      result = controller.run("heading-2")
    },
    { discrete: true },
  )
  expect(await result).toBe(false)
  await Promise.resolve()
  expect(editor.getEditorState().toJSON()).toEqual(before)
  expect(editor.read(() => beforeSelection?.is($getSelection()))).toBe(true)
  editor.dispose()
})

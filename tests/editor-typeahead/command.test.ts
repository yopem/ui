import { createEditorTypeahead } from "@editor/typeahead"
import { buildEditorFromExtensions } from "@lexical/extension"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
} from "lexical"

test("selection inside native command dispatch is synchronous and blocks fallback", () => {
  let actions = 0
  let fallback = 0

  const controller = createEditorTypeahead({
    commands: [
      {
        id: "custom",
        label: "Custom",
        description: "Count host actions",
        run() {
          actions++
        },
      },
    ],
  })

  const editor = buildEditorFromExtensions({
    name: "test/nested-command",
    dependencies: [RichTextExtension, controller.extension],
  })

  const select = createCommand<void>("test/select-typeahead")
  editor.registerCommand(
    select,
    () => controller.choose("custom"),
    COMMAND_PRIORITY_HIGH,
  )
  editor.registerCommand(
    select,
    () => {
      fallback++

      return true
    },
    COMMAND_PRIORITY_LOW,
  )
  editor.update(
    () => {
      const text = $createTextNode("/custom")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  expect(editor.dispatchCommand(select, undefined)).toBe(true)
  expect(actions).toBe(1)
  expect(fallback).toBe(0)
  editor.read(() => expect($getRoot().getTextContent()).toBe(""))
  editor.dispose()
})

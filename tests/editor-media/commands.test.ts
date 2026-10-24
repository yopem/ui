import { MediaExtension } from "@editor/media/extension"
import { $createMediaNode, MediaNode } from "@editor/media/model"
import { buildEditorFromExtensions } from "@lexical/extension"
import { expect, test } from "bun:test"
import {
  $createNodeSelection,
  $createParagraphNode,
  $getRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from "lexical"

for (const command of [KEY_DELETE_COMMAND, KEY_BACKSPACE_COMMAND]) {
  for (const mode of ["media", "mixed", "empty", "readonly"] as const) {
    test(`${command.type} handles ${mode} selection without partial deletion`, () => {
      const editor = buildEditorFromExtensions({
        name: `test/media-${mode}`,
        dependencies: [MediaExtension],
      })

      let fallback = false

      const unregister = editor.registerCommand(
        command,
        () => {
          fallback = true

          return false
        },
        COMMAND_PRIORITY_EDITOR,
      )

      try {
        editor.update(
          () => {
            const media = $createMediaNode({
              kind: "image",
              url: "https://media.test/image.png",
            })

            const paragraph = $createParagraphNode()
            $getRoot().append(media, paragraph)
            const selection = $createNodeSelection()

            if (mode !== "empty") selection.add(media.getKey())

            if (mode === "mixed") selection.add(paragraph.getKey())
            $setSelection(selection)
          },
          { discrete: true },
        )

        if (mode === "readonly") editor.setEditable(false)
        editor.update(
          () => {
            const before = $getRoot().getChildrenKeys()

            const event: KeyboardEvent = Object.assign(
              new Event("keydown", { cancelable: true }),
              {
                key: "Delete",
                code: "Delete",
                location: 0,
                repeat: false,
                isComposing: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                charCode: 0,
                keyCode: 46,
                detail: 0,
                view: null,
                which: 46,
                DOM_KEY_LOCATION_STANDARD: 0 as const,
                DOM_KEY_LOCATION_LEFT: 1 as const,
                DOM_KEY_LOCATION_RIGHT: 2 as const,
                DOM_KEY_LOCATION_NUMPAD: 3 as const,
                getModifierState() {
                  return false
                },
                initKeyboardEvent() {
                  throw new Error("Deprecated event initializer")
                },
                initUIEvent() {
                  throw new Error("Deprecated event initializer")
                },
              },
            )

            expect(editor.dispatchCommand(command, event)).toBe(
              mode === "media",
            )
            expect(event.defaultPrevented).toBe(mode === "media")
            expect(fallback).toBe(mode !== "media")

            if (mode === "media")
              expect(
                $getRoot()
                  .getChildren()
                  .some((node) => node instanceof MediaNode),
              ).toBe(false)
            else expect($getRoot().getChildrenKeys()).toEqual(before)
          },
          { discrete: true },
        )
      } finally {
        unregister()
        editor.dispose()
      }
    })
  }
}

import { documentNodes } from "@editor/document/convert"
import {
  EditorWordClipboardExtension,
  registerWordClipboardPaste,
} from "@editor/word-clipboard"
import { $insertDataTransferForRichText } from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { withDOM } from "@lexical/headless/dom"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  defineExtension,
  PASTE_TAG,
} from "lexical"

import { wordImageHTML } from "./word-html.fixture"

for (const mutation of ["selection", "content"] as const) {
  test(`Word resolver ${mutation} changes reject only the stale insertion`, () => {
    const editor = buildEditorFromExtensions(
      defineExtension({
        name: `word-target-${mutation}`,
        nodes: documentNodes,
        dependencies: [HeadlessExtension, EditorWordClipboardExtension],
        onError(error) {
          throw error
        },
      }),
    )

    const errors: string[] = []
    editor.update(
      () => {
        const original = $createTextNode("Keep target")
        $getRoot().append($createParagraphNode().append(original))
        original.select(0, original.getTextContentSize())
      },
      { discrete: true },
    )

    const unregister = registerWordClipboardPaste(
      editor,
      (error) => errors.push(error.message),
      {
        resolveImage(image) {
          const range = $getSelection()

          if (!$isRangeSelection(range)) throw new Error("Missing target range")

          if (mutation === "selection") {
            range.anchor.set(range.anchor.key, 0, "text")
            range.focus.set(range.focus.key, 0, "text")
          } else {
            const target = range.anchor.getNode()

            if (!$isTextNode(target)) throw new Error("Missing target text")
            target.setTextContent("Host updated content")
          }

          return {
            kind: "image",
            url: "https://assets.example.test/word.png",
            alt: image.alt,
          }
        },
      },
    )

    try {
      editor.update(
        () => {
          const range = $getSelection()

          if (!range) throw new Error("Missing current selection")
          withDOM((window) => {
            const data = new window.DataTransfer()
            data.setData("text/html", wordImageHTML)
            $insertDataTransferForRichText(data, range)
          })
        },
        { discrete: true, tag: PASTE_TAG },
      )
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain("changed during import")
      const state = editor.getEditorState()
      expect(state.read(() => $getRoot().getTextContent())).toBe(
        mutation === "content" ? "Host updated content" : "Keep target",
      )
      expect(JSON.stringify(state.toJSON())).not.toContain(
        '"type":"yopem-media"',
      )
      state.read(() => {
        const range = $getSelection()
        expect($isRangeSelection(range)).toBe(true)

        if (mutation === "selection" && $isRangeSelection(range)) {
          expect(range.anchor.offset).toBe(0)
          expect(range.focus.offset).toBe(0)
        }
      })
    } finally {
      unregister()
      editor.dispose()
    }
  })
}

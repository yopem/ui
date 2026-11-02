import type { DocumentError } from "@editor/document/boundary"

import { documentNodes } from "@editor/document/convert"
import { registerDocumentPaste } from "@editor/document/index"
import {
  EditorWordClipboardExtension,
  registerWordClipboardPaste,
} from "@editor/word-clipboard"
import { $insertDataTransferForRichText } from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import { registerRichText } from "@lexical/rich-text"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  defineExtension,
  PASTE_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"
import { readFile } from "node:fs/promises"

type RegistrationOrder = "document-first" | "word-first"

function createEditor() {
  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "word-clipboard-heading-fragment-test",
      nodes: documentNodes,
      dependencies: [HeadlessExtension, EditorWordClipboardExtension],
      onError(error) {
        throw error
      },
    }),
  )

  const unregisterRichText = registerRichText(editor)

  return {
    editor,
    dispose() {
      unregisterRichText()
      editor.dispose()
    },
  }
}

function registerPasteHandlers(
  editor: ReturnType<typeof createEditor>["editor"],
  errors: string[],
  order: RegistrationOrder,
) {
  function onError(error: DocumentError) {
    errors.push(error.message)
  }

  function registerDocument() {
    return registerDocumentPaste(editor, onError)
  }

  function registerWord() {
    return registerWordClipboardPaste(editor, onError)
  }

  return order === "document-first"
    ? [registerDocument(), registerWord()]
    : [registerWord(), registerDocument()]
}

function release(registrations: (() => void)[]) {
  for (const unregister of registrations.splice(0).reverse()) unregister()
}

function seedTarget(editor: ReturnType<typeof createEditor>["editor"]) {
  editor.update(
    () => {
      const target = $createTextNode("Keep original tail")
      $getRoot().clear().append($createParagraphNode().append(target))
      target.select(5, 13)
    },
    { discrete: true },
  )
}

function pasteHTML(
  editor: ReturnType<typeof createEditor>["editor"],
  window: typeof globalThis.window,
  html: string,
) {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection))
        throw new Error("Missing active range selection.")

      const data = new window.DataTransfer()
      data.setData("text/html", html)
      data.setData("text/plain", "Pinned public fixture fallback")
      $insertDataTransferForRichText(data, selection)
    },
    { discrete: true, tag: PASTE_TAG },
  )
}

test("pinned Word heading replaces selected text and stays undoable", async () => {
  const html = await readFile(
    new URL("./fixtures/plate-word-lists.html.fixture", import.meta.url),
    "utf8",
  )

  for (const order of ["document-first", "word-first"] as const) {
    const harness = createEditor()
    const { editor } = harness
    const errors: string[] = []
    const registrations: (() => void)[] = []
    let unregisterHistory: (() => void) | undefined

    try {
      unregisterHistory = registerHistory(
        editor,
        createEmptyHistoryState(),
        300,
      )
      seedTarget(editor)
      const before = editor.getEditorState().toJSON()
      registrations.push(...registerPasteHandlers(editor, errors, order))
      withDOM((window) => pasteHTML(editor, window, html))

      expect(errors).toEqual([])
      const pasted = editor.getEditorState()
      const serialized = JSON.stringify(pasted.toJSON())

      pasted.read(() => {
        const root = $getRoot()

        const heading = root
          .getChildren()
          .find((node) => node.getType() === "heading")

        expect(heading?.getTextContent().trim()).toBe("Some nested lists")
        expect(root.getTextContent()).toContain("Keep ")
        expect(root.getTextContent()).toContain(" tail")
        expect(root.getTextContent()).not.toContain("original")
        expect(root.getTextContent()).not.toContain(
          "Pinned public fixture fallback",
        )
      })
      expect(serialized.match(/"type":"list"/g) ?? []).toHaveLength(7)
      expect(serialized.match(/"type":"listitem"/g) ?? []).toHaveLength(10)

      editor.dispatchCommand(UNDO_COMMAND, undefined)
      await Promise.resolve()
      expect(editor.getEditorState().toJSON()).toEqual(before)

      editor.dispatchCommand(REDO_COMMAND, undefined)
      await Promise.resolve()
      editor.getEditorState().read(() => {
        const heading = $getRoot()
          .getChildren()
          .find((node) => node.getType() === "heading")

        expect(heading?.getTextContent().trim()).toBe("Some nested lists")
      })
    } finally {
      release(registrations)
      unregisterHistory?.()
      harness.dispose()
    }
  }
})

test("ordinary Word paragraphs keep native paragraph merging", () => {
  withDOM((window) => {
    const harness = createEditor()
    const { editor } = harness
    const errors: string[] = []

    const registrations = registerPasteHandlers(
      editor,
      errors,
      "document-first",
    )

    try {
      seedTarget(editor)
      pasteHTML(
        editor,
        window,
        '<html><body><p class="MsoNormal">Pasted paragraph</p></body></html>',
      )

      expect(errors).toEqual([])
      editor.getEditorState().read(() => {
        const children = $getRoot().getChildren()

        expect(children.map((node) => node.getType())).toEqual(["paragraph"])
        expect(children[0]?.getTextContent()).toBe("Keep Pasted paragraph tail")
      })
    } finally {
      release(registrations)
      harness.dispose()
    }
  })
})

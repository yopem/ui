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
import { registerRichText } from "@lexical/rich-text"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  defineExtension,
  PASTE_COMMAND,
  PASTE_TAG,
} from "lexical"

import { wordHTML } from "./word-html.fixture"

type RegistrationOrder = "document-first" | "word-first"

function createEditor() {
  const editor = buildEditorFromExtensions(
    defineExtension({
      name: "word-clipboard-middleware-order-test",
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
      const target = $createTextNode("Keep original")
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
  text: string,
) {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection))
        throw new Error("Missing active range selection.")

      const data = new window.DataTransfer()
      data.setData("text/html", html)
      data.setData("text/plain", text)
      $insertDataTransferForRichText(data, selection)
    },
    { discrete: true, tag: PASTE_TAG },
  )
}

for (const order of ["document-first", "word-first"] as const) {
  for (const separator of ["", "\n"] as const) {
    test(`Word HTML reaches Word middleware before generic validation (${order}, ${separator ? "spaced" : "compact"})`, () => {
      withDOM((window) => {
        const harness = createEditor()
        const { editor } = harness
        const errors: string[] = []
        const registrations = registerPasteHandlers(editor, errors, order)

        try {
          seedTarget(editor)
          pasteHTML(
            editor,
            window,
            wordHTML.replaceAll("</p><p", `</p>${separator}<p`),
            "Word heading First item Nested item Second item Field Value State Ready",
          )

          const state = editor.getEditorState()
          const text = state.read(() => $getRoot().getTextContent())
          const serialized = JSON.stringify(state.toJSON())

          expect(errors).toEqual([])
          expect(text.startsWith("Keep ")).toBe(true)
          expect(text).not.toContain("original")
          expect(text).toContain("Word heading")
          expect(text).toContain("First item")
          expect(text).toContain("Nested item")
          expect(text).toContain("Second item")
          expect(text).toContain("Ready")
          expect(serialized).toContain('"type":"list"')
          expect(serialized.match(/"type":"listitem"/g) ?? []).toHaveLength(3)
          expect(serialized).toContain('"type":"table"')
          expect(serialized.match(/"type":"tablerow"/g) ?? []).toHaveLength(2)

          release(registrations)
          const reRegistrations = registerPasteHandlers(editor, errors, order)
          release(reRegistrations)
        } finally {
          release(registrations)
          harness.dispose()
        }
      })
    })
  }
}

test("non-Word HTML still reaches generic CSS validation", () => {
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
      const before = editor.getEditorState().toJSON()
      pasteHTML(
        editor,
        window,
        '<p style="font-family: Papyrus">Rejected CSS</p>',
        "Rejected CSS",
      )

      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain("Unsupported or unsafe CSS: font-family.")
      expect(editor.getEditorState().toJSON()).toEqual(before)
    } finally {
      release(registrations)
      harness.dispose()
    }
  })
})

for (const priority of [
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
] as const) {
  test(`host PASTE_COMMAND veto at priority ${priority} blocks Word import`, () => {
    withDOM((window) => {
      const harness = createEditor()
      const { editor } = harness
      const errors: string[] = []

      const registrations = registerPasteHandlers(
        editor,
        errors,
        "document-first",
      )

      let calls = 0

      const unregisterHost = editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          calls += 1
          event?.preventDefault()

          return true
        },
        priority,
      )

      try {
        seedTarget(editor)
        const before = editor.getEditorState().toJSON()
        const data = new window.DataTransfer()
        data.setData("text/html", wordHTML)
        data.setData("text/plain", "Word heading First item")

        const event = new window.ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData: data,
        })

        editor.dispatchCommand(PASTE_COMMAND, event)

        expect(calls).toBe(1)
        expect(event.defaultPrevented).toBe(true)
        expect(editor.getEditorState().toJSON()).toEqual(before)
        expect(errors).toEqual([])
      } finally {
        unregisterHost()
        release(registrations)
        harness.dispose()
      }
    })
  })
}

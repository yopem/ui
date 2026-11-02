import { EditorFootnoteClipboardExtension } from "@editor/footnote-clipboard"
import { $insertDataTransferForRichText } from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { registerRichText } from "@lexical/rich-text"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import {
  documentNodes,
  EditorDocumentClipboardExtension,
  parseDocument,
  registerDocumentPaste,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  defineExtension,
  PASTE_COMMAND,
  PASTE_TAG,
} from "lexical"

function selectionSnapshot() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) throw new Error("Missing selection.")

  return {
    anchor: [
      selection.anchor.key,
      selection.anchor.offset,
      selection.anchor.type,
    ],
    focus: [selection.focus.key, selection.focus.offset, selection.focus.type],
    backward: selection.isBackward(),
    text: selection.getTextContent(),
  }
}

test("duplicate native JSON stops HTML, Markdown and plain text fallback", () => {
  withDOM((window) => {
    const editor = buildEditorFromExtensions(
      defineExtension({
        name: "document-duplicate-clipboard",
        nodes: documentNodes,
        dependencies: [HeadlessExtension, EditorDocumentClipboardExtension],
        onError(error) {
          throw error
        },
      }),
    )

    const unregisterRichText = registerRichText(editor)
    const errors: string[] = []

    const unregister = registerDocumentPaste(
      editor,
      (error) => errors.push(error.message),
      { markdown: true },
    )

    try {
      editor.update(
        () => {
          const text = $createTextNode("Keep selected content")

          $getRoot().append($createParagraphNode().append(text))
          text.select(5, 13)
        },
        { discrete: true },
      )
      const before = editor.getEditorState().toJSON()

      for (const [duplicate, tag] of [
        [
          '"namespace":"document-duplicate-clipboard","namespace":"document-duplicate-clipboard","nodes":[]',
          PASTE_TAG,
        ],
        [
          '"namespace":"document-duplicate-clipboard","nodes":[{"type":"text","t\\u0079pe":"text"}]',
          undefined,
        ],
      ] as const) {
        const data = new window.DataTransfer()

        data.setData("application/x-lexical-editor", `{${duplicate}}`)
        data.setData("text/html", "<p>HTML fallback</p>")
        data.setData("text/markdown", "Markdown fallback")
        data.setData("text/plain", "Plain fallback")

        editor.update(
          () => {
            const selection = $getSelection()

            if (!$isRangeSelection(selection))
              throw new Error("Missing selection.")
            $insertDataTransferForRichText(data, selection)
          },
          { discrete: true, tag },
        )

        expect(editor.getEditorState().toJSON()).toEqual(before)
        editor.getEditorState().read(() => {
          const selection = $getSelection()

          expect(
            $isRangeSelection(selection) && selection.getTextContent(),
          ).toBe("selected")
        })
      }

      expect(errors).toEqual([
        "Duplicate document JSON key.",
        "Duplicate document JSON key.",
      ])

      let calls = 0

      const veto = editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          calls += 1
          event?.preventDefault()

          return true
        },
        COMMAND_PRIORITY_CRITICAL,
      )

      const data = new window.DataTransfer()

      data.setData("application/x-lexical-editor", '{"x":1,"x":2}')
      data.setData("text/plain", "Fallback")

      const event = new window.ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      })

      editor.dispatchCommand(PASTE_COMMAND, event)
      expect(calls).toBe(1)
      expect(event.defaultPrevented).toBe(true)
      expect(errors).toHaveLength(2)
      expect(editor.getEditorState().toJSON()).toEqual(before)

      veto()
    } finally {
      unregister()
      unregisterRichText()
      editor.dispose()
    }
  })
})

test("footnote clipboard rejects oversized native JSON before parsing", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "ClipboardEvent")

  try {
    withDOM((window) => {
      Object.defineProperty(globalThis, "ClipboardEvent", {
        configurable: true,
        writable: true,
        value: window.ClipboardEvent,
      })

      const editor = buildEditorFromExtensions(
        defineExtension({
          name: "document-footnote-limit",
          nodes: documentNodes,
          dependencies: [
            HeadlessExtension,
            EditorDocumentClipboardExtension,
            EditorFootnoteClipboardExtension,
          ],
          onError(error) {
            throw error
          },
        }),
      )

      const unregisterRichText = registerRichText(editor)
      const errors: string[] = []

      const unregister = registerDocumentPaste(editor, (error) =>
        errors.push(error.message),
      )

      try {
        editor.update(
          () => {
            const text = $createTextNode("Keep selected content")

            $getRoot().append($createParagraphNode().append(text))
            text.select(5, 13)
          },
          { discrete: true },
        )
        const before = editor.getEditorState().toJSON()
        const selection = editor.getEditorState().read(selectionSnapshot)

        const originalText = editor
          .getEditorState()
          .read(() => $getRoot().getTextContent())

        for (const value of ["x".repeat(1_048_577), "é".repeat(524_289)]) {
          const json = JSON.stringify({
            namespace: "document-footnote-limit",
            nodes: [],
            value,
          })

          const data = new window.DataTransfer()

          data.setData("application/x-lexical-editor", json)
          data.setData("text/plain", "Fallback")

          const event = new window.ClipboardEvent("paste", {
            bubbles: true,
            cancelable: true,
            clipboardData: data,
          })

          const parse = JSON.parse
          let parsed = false

          JSON.parse = (...args: Parameters<typeof JSON.parse>) => {
            if (args[0] === json) parsed = true

            return parse(...args)
          }

          try {
            editor.dispatchCommand(PASTE_COMMAND, event)
          } finally {
            JSON.parse = parse
          }

          expect(parsed).toBe(false)
          expect(event.defaultPrevented).toBe(true)
          expect(editor.getEditorState().toJSON()).toEqual(before)
          expect(editor.getEditorState().read(selectionSnapshot)).toEqual(
            selection,
          )
          expect(
            editor.getEditorState().read(() => $getRoot().getTextContent()),
          ).toBe(originalText)
        }

        expect(errors).toEqual([])
      } finally {
        unregister()
        unregisterRichText()
        editor.dispose()
      }
    })
  } finally {
    if (previous) Object.defineProperty(globalThis, "ClipboardEvent", previous)
    else Reflect.deleteProperty(globalThis, "ClipboardEvent")
  }

  expect(Object.getOwnPropertyDescriptor(globalThis, "ClipboardEvent")).toEqual(
    previous,
  )
})

test("Markdown slot paste rejects without replacing selected text", () => {
  withDOM((window) => {
    const editor = buildEditorFromExtensions(
      defineExtension({
        name: "document-slot-clipboard",
        nodes: documentNodes,
        dependencies: [HeadlessExtension, EditorDocumentClipboardExtension],
        onError(error) {
          throw error
        },
      }),
    )

    const unregisterRichText = registerRichText(editor)
    const errors: string[] = []

    const unregister = registerDocumentPaste(
      editor,
      (error) => {
        errors.push(error.message)
      },
      { markdown: true },
    )

    try {
      editor.update(
        () => {
          const text = $createTextNode("Keep selected content")
          $getRoot().append($createParagraphNode().append(text))
          text.select(5, 13)
        },
        { discrete: true },
      )
      const before = editor.getEditorState().toJSON()
      const selection = editor.getEditorState().read(selectionSnapshot)

      const originalText = editor
        .getEditorState()
        .read(() => $getRoot().getTextContent())

      for (const source of [
        '<p>Host</p><div data-editor-slot="note"><p>Slot</p></div>',
        '<blockquote><p>Host</p><div data-editor-slot="note"><p>Slot</p></div></blockquote>',
      ]) {
        expect(parseDocument(source, "markdown").root).toBeDefined()
        editor.update(
          () => {
            const selection = $getSelection()

            if (!$isRangeSelection(selection))
              throw new Error("Missing selection.")

            const data = new window.DataTransfer()
            data.setData("text/markdown", source)
            data.setData(
              "text/plain",
              "Plain fallback must not replace selection",
            )
            $insertDataTransferForRichText(data, selection)
          },
          { discrete: true, tag: PASTE_TAG },
        )
        expect(errors.at(-1)).toContain(
          "Markdown fragments cannot contain slots.",
        )
        expect(editor.getEditorState().toJSON()).toEqual(before)
        editor.getEditorState().read(() => {
          expect($getRoot().getTextContent()).toBe(originalText)
          expect(selectionSnapshot()).toEqual(selection)
          expect(selection.text).toBe("selected")
        })
      }

      expect(errors).toHaveLength(2)
    } finally {
      unregister()
      unregisterRichText()
      editor.dispose()
    }
  })
})

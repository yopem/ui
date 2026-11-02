import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND, defineExtension } from "lexical"
import { z } from "zod"

import {
  validateEditorFootnoteClipboardHTML,
  validateEditorFootnoteClipboardJSON,
} from "./footnote-model"

const clipboardEnvelopeSchema = z.looseObject({
  nodes: z.array(z.unknown()).max(10_000),
})

const clipboardNodeSchema = z.looseObject({
  type: z.string().optional(),
  children: z.array(z.unknown()).optional(),
  $slots: z.record(z.string(), z.unknown()).optional(),
})

function containsFootnoteNode(nodes: readonly unknown[]) {
  const pending: unknown[] = [...nodes]
  let count = 0

  while (pending.length > 0) {
    const current = pending.pop()

    if (++count > 10_000)
      throw new Error("Footnote clipboard has too many nodes")
    const parsed = clipboardNodeSchema.safeParse(current)

    if (!parsed.success) continue

    if (parsed.data.type?.startsWith("editor-footnote-")) return true
    const children = parsed.data.children ?? []
    const slots = Object.values(parsed.data.$slots ?? {})

    if (pending.length + children.length + slots.length + count > 10_000)
      throw new Error("Footnote clipboard has too many nodes")

    pending.push(...children, ...slots)
  }

  return false
}

function rejectPaste(event: Event) {
  event.preventDefault()

  return true
}

export const EditorFootnoteClipboardExtension = defineExtension({
  name: "@yopem-ui/editor/footnote-clipboard",
  register(editor) {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (event?.defaultPrevented) return false

        if (
          !editor.isEditable() ||
          !event ||
          !(event instanceof ClipboardEvent) ||
          !event.clipboardData
        )
          return false

        try {
          const json = event.clipboardData.getData(
            "application/x-lexical-editor",
          )

          const html = event.clipboardData.getData("text/html")

          if (
            json.length > 1_048_576 ||
            (json.length > 0 &&
              new TextEncoder().encode(json).byteLength > 1_048_576) ||
            (html.includes("data-editor-footnote") && html.length > 1_048_576)
          )
            throw new Error("Clipboard payload is too large")

          if (json) {
            let value: unknown

            try {
              value = JSON.parse(json)
            } catch {
              if (json.includes("editor-footnote-"))
                throw new Error("Invalid footnote clipboard JSON")
            }

            const envelope = clipboardEnvelopeSchema.safeParse(value)

            if (envelope.success) {
              if (containsFootnoteNode(envelope.data.nodes)) {
                validateEditorFootnoteClipboardJSON({
                  root: { type: "root", children: envelope.data.nodes },
                })
              }
            } else if (json.includes("editor-footnote-")) {
              throw new Error("Invalid footnote clipboard JSON")
            }
          }

          if (html.includes("data-editor-footnote")) {
            validateEditorFootnoteClipboardHTML(html)
          }
        } catch {
          return rejectPaste(event)
        }

        return false
      },
      COMMAND_PRIORITY_HIGH,
    )
  },
})

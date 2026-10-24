import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND, defineExtension } from "lexical"
import { z } from "zod"

import { validateEditorTocHTML, validateEditorTocJSON } from "./toc-model"

const clipboardEnvelopeSchema = z.looseObject({
  nodes: z.array(z.unknown()).max(10_000),
})

function rejectPaste(event: Event) {
  event.preventDefault()

  return true
}

export const EditorTocClipboardExtension = defineExtension({
  name: "@yopem-ui/editor/toc-clipboard",
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
            (json.includes("editor-toc") && json.length > 1_048_576) ||
            (html.includes("data-editor-toc") && html.length > 1_048_576)
          )
            throw new Error("Clipboard payload is too large")

          if (json.includes("editor-toc")) {
            const value: unknown = JSON.parse(json)
            const envelope = clipboardEnvelopeSchema.parse(value)

            validateEditorTocJSON({
              root: { type: "root", children: envelope.nodes },
            })
          }

          if (html.includes("data-editor-toc")) validateEditorTocHTML(html)
        } catch {
          return rejectPaste(event)
        }

        return false
      },
      COMMAND_PRIORITY_HIGH,
    )
  },
})

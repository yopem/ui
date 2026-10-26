"use client"

import { Text } from "@registry/components/ui/text"
import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import { EditorDocumentPrintControl } from "@yopem-ui/editor/document-export"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Print a canonical document snapshot without changing editor history.",
          },
        ],
      },
    ],
  },
})

export function DocumentPrintExample() {
  return (
    <EditorRoot ariaLabel="Document print example" initialState={initialState}>
      <EditorContent />
      <EditorDocumentPrintControl title="Editor document" />
      <Text>
        Print uses local browser fonts. It does not install an image capture
        SDK.
      </Text>
    </EditorRoot>
  )
}

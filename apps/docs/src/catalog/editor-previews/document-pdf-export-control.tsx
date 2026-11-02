"use client"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { captureEditorDocumentImageWithHtmlToImage } from "@yopem-ui/editor/document-export-html-to-image"
import { EditorDocumentPDFExportControl } from "@yopem-ui/editor/document-export-pdf"
import { useState } from "react"

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
            text: "Export this field report as one raster PDF page.",
          },
        ],
      },
    ],
  },
})

export function Preview() {
  const [editable, setEditable] = useState(true)
  const [mounted, setMounted] = useState(true)

  return (
    <Stack>
      <Text>
        Download one raster PDF page. Text in this PDF is not selectable.
      </Text>
      <Button aria-pressed={!editable} onClick={() => setEditable(!editable)}>
        {editable ? "Make PDF editor read-only" : "Enable PDF editor editing"}
      </Button>
      <Button onClick={() => setMounted(!mounted)}>
        {mounted ? "Unmount PDF editor" : "Mount PDF editor"}
      </Button>
      {mounted ? (
        <EditorRoot
          ariaLabel="PDF export example"
          editable={editable}
          initialState={initialState}
        >
          <EditorToolbar aria-label="PDF export history">
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent />
          <EditorDocumentPDFExportControl
            capture={captureEditorDocumentImageWithHtmlToImage}
          />
        </EditorRoot>
      ) : null}
    </Stack>
  )
}

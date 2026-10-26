"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { EditorDocumentExportControls } from "@yopem-ui/editor/document-export"
import { captureEditorDocumentImageWithHtmlToImage } from "@yopem-ui/editor/document-export-html-to-image"
import { EditorMathExtension } from "@yopem-ui/editor/math"
import { useState } from "react"

const extensions = [EditorMathExtension]

function textNode(text: string) {
  return {
    type: "text",
    version: 1,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
  }
}

function element(
  type: string,
  children: unknown[],
  properties: {
    tag?: "h2" | "ul"
    colSpan?: number
    headerState?: number
    rowSpan?: number
    format?: number
    checked?: boolean
    value?: number
    listType?: "bullet"
    start?: number
  } = {},
) {
  return {
    type,
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    ...properties,
    children,
  }
}

function paragraph(text: string) {
  return element("paragraph", [textNode(text)])
}

function tableCell(text: string, headerState: number) {
  return element("tablecell", [paragraph(text)], {
    colSpan: 1,
    headerState,
    rowSpan: 1,
    format: 0,
  })
}

const initialState = JSON.stringify({
  root: element("root", [
    element("heading", [textNode("Field report")], { tag: "h2" }),
    element("paragraph", [
      textNode("A report with a native equation "),
      { type: "editor-math", version: 1, kind: "inline", tex: "x^2" },
      textNode("."),
    ]),
    element(
      "list",
      [
        element("listitem", [paragraph("Export list item")], {
          checked: false,
          format: 0,
          value: 1,
        }),
      ],
      { listType: "bullet", start: 1, tag: "ul" },
    ),
    element("table", [
      element("tablerow", [tableCell("Item", 1), tableCell("Status", 1)]),
      element("tablerow", [tableCell("Report", 0), tableCell("Ready", 0)]),
    ]),
  ]),
})

export function PublicDocumentExportExample() {
  const [editable, setEditable] = useState(true)
  const [mounted, setMounted] = useState(true)

  return (
    <Stack>
      <Text>
        Print the validated document or export one bounded PNG. Remote images
        need an explicit host resolver.
      </Text>
      <Heading>Document export</Heading>
      <Box>
        <Button
          aria-pressed={!editable}
          onClick={() => setEditable((current) => !current)}
        >
          {editable
            ? "Make export editor read-only"
            : "Enable export editor editing"}
        </Button>
        <Button onClick={() => setMounted((current) => !current)}>
          {mounted ? "Unmount export editor" : "Mount export editor"}
        </Button>
      </Box>
      {mounted ? (
        <EditorRoot
          ariaLabel="Document export example"
          editable={editable}
          extensions={extensions}
          initialState={initialState}
        >
          <EditorToolbar aria-label="Document export history">
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent />
          <EditorDocumentExportControls
            capture={captureEditorDocumentImageWithHtmlToImage}
            title="Field report"
          />
        </EditorRoot>
      ) : null}
    </Stack>
  )
}

"use client"

import type { MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $generateHtmlFromNodes } from "@lexical/html"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import { EditorTocControls, EditorTocExtension } from "@yopem-ui/editor/toc"
import { useState } from "react"

function preventToolbarBlur(event: MouseEvent<HTMLElement>) {
  event.preventDefault()
}

const styles = stylex.create({
  html: {
    color: tokens["--muted-foreground"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.75rem",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
})

function textNode(text: string) {
  return {
    type: "text",
    version: 1,
    text,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
  }
}

function headingNode(tag: "h1" | "h2", text: string) {
  return {
    type: "heading",
    tag,
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [textNode(text)],
  }
}

function paragraphNode(text: string) {
  return {
    type: "paragraph",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [textNode(text)],
  }
}

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      headingNode("h1", "Guide overview"),
      paragraphNode("Add a table of contents, then change a heading."),
      headingNode("h2", "First steps"),
      paragraphNode("This section shows live heading updates."),
      headingNode("h2", "Reference"),
    ],
  },
})

function ExportDocumentHTML() {
  const editor = useEditor()
  const [html, setHTML] = useState("")

  const exportHTML = useStableCallback(function exportHTML() {
    setHTML(editor.getEditorState().read(() => $generateHtmlFromNodes(editor)))
  })

  return (
    <>
      <Button
        variant="outline"
        onMouseDown={preventToolbarBlur}
        onClick={exportHTML}
      >
        Export document HTML
      </Button>
      {html ? (
        <Box render={<section />} aria-label="Exported document HTML">
          <Box render={<pre />} xstyle={styles.html}>
            {html}
          </Box>
        </Box>
      ) : null}
    </>
  )
}

export function PublicTocExample() {
  const [extensions] = useState(() => [EditorTocExtension])

  return (
    <Box data-testid="public-toc-example">
      <Stack>
        <Text>Insert a live overview. Edit a heading to update its link.</Text>
        <EditorRoot
          ariaLabel="Public table of contents editor"
          extensions={extensions}
          initialState={initialState}
        >
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
            <EditorTocControls />
          </EditorToolbar>
          <EditorContent placeholder="Write a structured document…" />
          <ExportDocumentHTML />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

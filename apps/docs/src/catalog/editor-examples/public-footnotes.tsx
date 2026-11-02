"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  createEditorFootnoteTypeahead,
  EditorFootnoteControls,
  EditorFootnoteExtension,
  EditorFootnoteTypeahead,
} from "@yopem-ui/editor/footnote"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { useState } from "react"

function textNode(text: string, format = 0) {
  return {
    type: "text",
    version: 1,
    text,
    detail: 0,
    format,
    mode: "normal",
    style: "",
  }
}

function referenceNode(identifier: string) {
  return { type: "editor-footnote-reference", version: 1, identifier }
}

function paragraphNode<T extends object>(children: T[]) {
  return {
    type: "paragraph",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children,
  }
}

function definitionNode(identifier: string, body: string, format = 0) {
  return {
    type: "editor-footnote-definition",
    version: 1,
    identifier,
    direction: null,
    format: "",
    indent: 0,
    children: [paragraphNode([textNode(body, format)])],
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
      paragraphNode([
        textNode("A native reference"),
        referenceNode("1"),
        textNode(" appears again"),
        referenceNode("1"),
        textNode(", while an unresolved reference stays in place"),
        referenceNode("2"),
        textNode("."),
      ]),
      definitionNode("1", "Rich footnote body", 1),
      definitionNode("3", "First duplicate definition body"),
      definitionNode("3", "Second duplicate definition body"),
    ],
  },
})

export function PublicFootnotesExample() {
  const [controller] = useState(createEditorFootnoteTypeahead)

  const [extensions] = useState(() => [
    EditorFootnoteExtension,
    controller.extension,
  ])

  return (
    <Box data-testid="public-footnotes-example">
      <Stack>
        <Text>Type [^ to add a reference. Edit rich definitions in place.</Text>
        <EditorRoot
          ariaLabel="Public footnotes editor"
          extensions={extensions}
          initialState={initialState}
        >
          <EditorToolbar>
            <EditorHistoryButton
              action="undo"
              aria-label="Undo"
              title="Undo"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <Undo2Icon aria-hidden="true" size={16} />
            </EditorHistoryButton>
            <EditorHistoryButton
              action="redo"
              aria-label="Redo"
              title="Redo"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <Redo2Icon aria-hidden="true" size={16} />
            </EditorHistoryButton>
            <EditorFootnoteControls />
          </EditorToolbar>
          <EditorFootnoteTypeahead
            controller={controller}
            placeholder="Type [^ to add a footnote reference."
          />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

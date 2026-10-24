"use client"

import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { EditorTocExtension, editorTocSlashCommand } from "@yopem-ui/editor/toc"
import {
  createEditorTypeahead,
  EditorTypeahead,
} from "@yopem-ui/editor/typeahead"
import { useState } from "react"

import { editorTocFixture } from "@/catalog/editor-example-fixtures/toc"

export function Preview() {
  const [controller] = useState(() =>
    createEditorTypeahead({ commands: [editorTocSlashCommand()] }),
  )

  const [extensions] = useState(() => [
    EditorTocExtension,
    controller.extension,
  ])

  return (
    <Box data-testid="toc-example">
      <Stack>
        <Text>Type /toc to insert a live overview of document headings.</Text>
        <EditorRoot
          ariaLabel="TOC editor"
          initialState={editorTocFixture}
          extensions={extensions}
        >
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorTypeahead controller={controller} />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

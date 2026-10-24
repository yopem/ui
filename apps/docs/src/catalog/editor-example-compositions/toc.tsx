"use client"

import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorTocInsertControl,
  EditorTocRemoveControl,
  EditorTocExtension,
} from "@yopem-ui/editor/toc"
import { useState } from "react"

import { editorTocFixture } from "@/catalog/editor-example-fixtures/toc"

export function TocExample() {
  const [extensions] = useState(() => [EditorTocExtension])

  return (
    <Box data-testid="toc-example">
      <Stack>
        <Text>Insert an overview. Change a heading to update its links.</Text>
        <EditorRoot
          ariaLabel="TOC editor"
          initialState={editorTocFixture}
          extensions={extensions}
        >
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
            <EditorTocInsertControl />
            <EditorTocRemoveControl />
          </EditorToolbar>
          <EditorContent />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

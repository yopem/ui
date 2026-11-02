"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorFootnoteBacklinks,
  EditorFootnoteExtension,
} from "@yopem-ui/editor/footnote"
import { useState } from "react"

import { editorFootnoteFixture } from "@/catalog/editor-example-fixtures/footnote"

export function Preview() {
  const [editable, setEditable] = useState(true)
  const [extensions] = useState(() => [EditorFootnoteExtension])

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  return (
    <Box data-testid="footnote-example">
      <Stack>
        <Wrap>
          <Text>Select a footnote definition to use its controls.</Text>
          <Button
            variant="outline"
            aria-pressed={!editable}
            onClick={toggleEditable}
          >
            Read only
          </Button>
        </Wrap>
        <EditorRoot
          ariaLabel="Footnote editor"
          initialState={editorFootnoteFixture}
          extensions={extensions}
          editable={editable}
        >
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
            <EditorFootnoteBacklinks />
          </EditorToolbar>
          <EditorContent />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

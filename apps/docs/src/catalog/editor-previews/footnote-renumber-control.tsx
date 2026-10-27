"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorFootnoteRenumberControl,
  EditorFootnoteExtension,
} from "@yopem-ui/editor/footnote"
import { useReducer, useState } from "react"

import { editorFootnoteFixture } from "@/catalog/editor-example-fixtures/footnote"

export function Preview() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const [extensions] = useState(() => [EditorFootnoteExtension])

  return (
    <Box data-testid="footnote-example">
      <Stack>
        <Text>Select a footnote definition to use its controls.</Text>
        <Button
          variant="outline"
          aria-pressed={!editable}
          onClick={toggleEditable}
        >
          Read only
        </Button>
        <EditorRoot
          ariaLabel="Footnote editor"
          initialState={editorFootnoteFixture}
          extensions={extensions}
          editable={editable}
        >
          <EditorToolbar>
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
            <EditorFootnoteRenumberControl />
          </EditorToolbar>
          <EditorContent />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

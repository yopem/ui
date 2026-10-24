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
  EditorFootnoteTypeahead,
} from "@yopem-ui/editor/footnote"
import { useState } from "react"

import { editorFootnoteFixture } from "@/catalog/editor-example-fixtures/footnote"

export function FootnoteExample() {
  const [editable, setEditable] = useState(true)
  const [controller] = useState(createEditorFootnoteTypeahead)
  const [extensions] = useState(() => [controller.extension])

  return (
    <Box data-testid="footnote-example">
      <Stack>
        <Text>Type [^ to link a reference or create a footnote.</Text>
        <Button
          variant="outline"
          aria-pressed={!editable}
          onClick={() => setEditable(!editable)}
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
            <EditorFootnoteControls />
          </EditorToolbar>
          <EditorFootnoteTypeahead
            controller={controller}
            placeholder="Type [^ to add a footnote."
          />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

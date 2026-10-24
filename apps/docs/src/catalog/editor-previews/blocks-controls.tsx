"use client"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorBlocksControls,
  EditorBlocksExtension,
} from "@yopem-ui/editor/blocks"
import { useReducer } from "react"

const extensions = [EditorBlockPresentationExtension, EditorBlocksExtension]

function toggleEditableState(editable: boolean) {
  return !editable
}

export function Preview() {
  const [editable, toggleEditable] = useReducer(toggleEditableState, true)

  return (
    <Stack>
      <Button onClick={toggleEditable}>
        {editable ? "Read only" : "Edit document"}
      </Button>
      <EditorRoot
        ariaLabel="EditorBlocksControls preview"
        extensions={extensions}
        editable={editable}
      >
        <EditorToolbar aria-label="Block tools">
          <EditorBlocksControls />
        </EditorToolbar>
        <EditorContent placeholder="Enter block content" />
      </EditorRoot>
    </Stack>
  )
}

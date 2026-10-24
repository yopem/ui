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
  EditorBlocksExtension,
  EditorCalloutAppearanceButton,
  EditorCalloutButton,
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
        ariaLabel="EditorCalloutAppearanceButton preview"
        extensions={extensions}
        editable={editable}
      >
        <EditorToolbar aria-label="Block tools">
          <EditorCalloutButton />
          <EditorCalloutAppearanceButton appearance="warning" />
        </EditorToolbar>
        <EditorContent placeholder="Enter block content" />
      </EditorRoot>
    </Stack>
  )
}

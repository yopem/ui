"use client"

import type { SyntheticEvent } from "react"

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
  EditorCalloutButton,
} from "@yopem-ui/editor/blocks"
import { useReducer } from "react"

const extensions = [EditorBlockPresentationExtension, EditorBlocksExtension]

function cancelInsert(event: SyntheticEvent) {
  event.preventDefault()
}

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
        ariaLabel="EditorCalloutButton preview"
        extensions={extensions}
        editable={editable}
      >
        <EditorToolbar aria-label="Block tools">
          <EditorCalloutButton />
          <EditorCalloutButton onClick={cancelInsert}>
            Cancelled callout
          </EditorCalloutButton>
        </EditorToolbar>
        <EditorContent placeholder="Enter block content" />
      </EditorRoot>
    </Stack>
  )
}

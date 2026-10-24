"use client"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import { EditorDateControls, EditorDateExtension } from "@yopem-ui/editor/date"
import { useReducer } from "react"

import { editorDateFixture } from "@/catalog/editor-example-fixtures/date"

const extensions = [EditorDateExtension]

function toggleEditableState(editable: boolean) {
  return !editable
}

export function DateExample() {
  const [editable, toggleEditable] = useReducer(toggleEditableState, true)

  return (
    <Stack>
      <Button onClick={toggleEditable}>
        {editable ? "Read only" : "Edit document"}
      </Button>
      <EditorRoot
        ariaLabel="Date example"
        editable={editable}
        extensions={extensions}
        initialState={editorDateFixture}
      >
        <EditorToolbar aria-label="Date tools">
          <EditorDateControls initialDate="2024-01-01" />
        </EditorToolbar>
        <EditorContent placeholder="Enter text and select a date" />
      </EditorRoot>
    </Stack>
  )
}

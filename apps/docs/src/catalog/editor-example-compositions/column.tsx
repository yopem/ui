"use client"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import {
  EditorColumnsControls,
  EditorColumnsExtension,
} from "@yopem-ui/editor/columns"
import { useReducer } from "react"

import { editorColumnFixture } from "@/catalog/editor-example-fixtures/column"

const extensions = [EditorColumnsExtension]

function toggleEditableState(editable: boolean) {
  return !editable
}

export function ColumnExample() {
  const [editable, toggleEditable] = useReducer(toggleEditableState, true)

  return (
    <Stack>
      <Button onClick={toggleEditable}>
        {editable ? "Read only" : "Edit document"}
      </Button>
      <EditorRoot
        ariaLabel="Column example"
        editable={editable}
        extensions={extensions}
        initialState={editorColumnFixture}
      >
        <EditorToolbar aria-label="Column tools">
          <EditorColumnsControls />
        </EditorToolbar>
        <EditorContent placeholder="Write in each column" />
      </EditorRoot>
    </Stack>
  )
}

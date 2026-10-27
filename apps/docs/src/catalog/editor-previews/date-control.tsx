"use client"

import { Button } from "@registry/components/ui/button"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import { EditorDateControls, EditorDateExtension } from "@yopem-ui/editor/date"
import { useReducer } from "react"

const extensions = [EditorDateExtension]

export function Preview() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  return (
    <>
      <Button onClick={toggleEditable}>Toggle read-only</Button>
      <EditorRoot
        ariaLabel="Date editor"
        editable={editable}
        extensions={extensions}
      >
        <EditorToolbar aria-label="Date controls">
          <EditorDateControls initialDate="2024-01-01" />
        </EditorToolbar>
        <EditorContent placeholder="Enter text, then insert a date" />
      </EditorRoot>
    </>
  )
}

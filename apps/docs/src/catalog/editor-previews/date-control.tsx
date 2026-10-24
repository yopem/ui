"use client"

import { Button } from "@registry/components/ui/button"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import { EditorDateControls, EditorDateExtension } from "@yopem-ui/editor/date"
import { useState } from "react"

const extensions = [EditorDateExtension]

export function Preview() {
  const [editable, setEditable] = useState(true)

  return (
    <>
      <Button onClick={() => setEditable((current) => !current)}>
        Toggle read-only
      </Button>
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

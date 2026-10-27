"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import {
  EditorColumnsControls,
  EditorColumnsExtension,
} from "@yopem-ui/editor/columns"
import { useState } from "react"

const extensions = [EditorColumnsExtension]

export function Preview() {
  const [editable, setEditable] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  return (
    <>
      <Button onClick={toggleEditable}>Toggle read-only</Button>
      <EditorRoot
        ariaLabel="Columns editor"
        editable={editable}
        extensions={extensions}
      >
        <EditorToolbar aria-label="Column controls">
          <EditorColumnsControls />
        </EditorToolbar>
        <EditorContent placeholder="Enter text, then insert columns" />
      </EditorRoot>
    </>
  )
}

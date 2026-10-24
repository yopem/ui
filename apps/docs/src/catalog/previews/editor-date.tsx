"use client"

import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import { EditorDateControls, EditorDateExtension } from "@yopem-ui/editor/date"

const extensions = [EditorDateExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="Date editor" extensions={extensions}>
      <EditorToolbar aria-label="Date controls">
        <EditorDateControls initialDate="2024-01-01" />
      </EditorToolbar>
      <EditorContent placeholder="Enter text, then insert a date" />
    </EditorRoot>
  )
}

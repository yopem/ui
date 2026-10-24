"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorTableButton,
  EditorTablePresentationExtension,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorTableButton preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorTableButton />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorTableButton,
  EditorTableMenu,
  EditorTablePresentationExtension,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorTableMenu preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorTableButton />
        <EditorTableMenu />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

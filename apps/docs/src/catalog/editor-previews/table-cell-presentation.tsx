"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorTableButton,
  EditorTableCellPresentation,
  EditorTablePresentationExtension,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorTableCellPresentation preview"
      extensions={extensions}
    >
      <EditorToolbar>
        <EditorTableButton />
      </EditorToolbar>
      <EditorTableCellPresentation />
      <EditorContent />
    </EditorRoot>
  )
}

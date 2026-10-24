"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorTableButton,
  EditorTablePresentationExtension,
  EditorTableResizeControls,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorTableResizeControls preview"
      extensions={extensions}
    >
      <EditorToolbar>
        <EditorTableButton />
      </EditorToolbar>
      <EditorTableResizeControls />
      <EditorContent />
    </EditorRoot>
  )
}

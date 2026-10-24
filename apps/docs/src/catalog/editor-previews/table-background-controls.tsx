"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorTableBackgroundControls,
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
    <EditorRoot
      ariaLabel="EditorTableBackgroundControls preview"
      extensions={extensions}
    >
      <EditorToolbar>
        <EditorTableButton />
      </EditorToolbar>
      <EditorTableBackgroundControls />
      <EditorContent />
    </EditorRoot>
  )
}

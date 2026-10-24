"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorTableBorderControls,
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
      ariaLabel="EditorTableBorderControls preview"
      extensions={extensions}
    >
      <EditorToolbar>
        <EditorTableButton />
      </EditorToolbar>
      <EditorTableBorderControls />
      <EditorContent />
    </EditorRoot>
  )
}

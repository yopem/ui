"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorLineHeightControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorLineHeightControl preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorLineHeightControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

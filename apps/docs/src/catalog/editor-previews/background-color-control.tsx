"use client"

import {
  EditorBackgroundColorControl,
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorBackgroundColorControl preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorBackgroundColorControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

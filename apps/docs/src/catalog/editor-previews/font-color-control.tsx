"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFontColorControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorFontColorControl preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorFontColorControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

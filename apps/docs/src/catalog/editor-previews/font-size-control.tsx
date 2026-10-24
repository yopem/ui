"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFontSizeControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorFontSizeControl preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorFontSizeControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

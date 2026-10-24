"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFontFamilyControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorFontFamilyControl preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorFontFamilyControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

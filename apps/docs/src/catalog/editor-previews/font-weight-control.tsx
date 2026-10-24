"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFontWeightControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorFontWeightControl preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorFontWeightControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

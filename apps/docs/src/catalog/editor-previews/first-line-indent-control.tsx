"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFirstLineIndentControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorFirstLineIndentControl preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorFirstLineIndentControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

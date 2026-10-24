"use client"

import {
  EditorAlignmentButton,
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorAlignmentButton preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorAlignmentButton alignment="center" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

"use client"

import {
  EditorBlockButton,
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorBlockButton preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorBlockButton block="h2" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

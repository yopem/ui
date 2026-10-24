"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorFormatButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorFormatButton preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorFormatButton format="bold" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

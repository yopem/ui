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
    <EditorRoot ariaLabel="EditorToolbar preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

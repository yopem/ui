"use client"

import {
  EditorBlockPresentationExtension,
  EditorClearFormattingButton,
  EditorContent,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorClearFormattingButton preview"
      extensions={extensions}
    >
      <EditorToolbar aria-label="Formatting">
        <EditorClearFormattingButton />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

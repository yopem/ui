"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorIndentButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorIndentButton preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorIndentButton direction="indent" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

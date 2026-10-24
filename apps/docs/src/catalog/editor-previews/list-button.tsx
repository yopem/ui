"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorListButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorListButton preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorListButton listType="bullet" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorHistoryButton preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorHistoryButton action="undo" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

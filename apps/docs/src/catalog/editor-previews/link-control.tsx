"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorLinkControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorLinkControl preview" extensions={extensions}>
      <EditorToolbar aria-label="Formatting">
        <EditorLinkControl />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

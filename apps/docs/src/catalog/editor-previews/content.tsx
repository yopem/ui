"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
} from "@yopem-ui/editor"

const extensions = [EditorBlockPresentationExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorContent preview" extensions={extensions}>
      <EditorContent placeholder="Write your notes…" />
    </EditorRoot>
  )
}

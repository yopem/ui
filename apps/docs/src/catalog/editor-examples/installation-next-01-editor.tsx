"use client"

import { EditorContent, EditorRoot } from "@yopem-ui/editor"

export function MinimalEditorExample() {
  return (
    <EditorRoot ariaLabel="Minimal editor">
      <EditorContent placeholder="Write your first document…" />
    </EditorRoot>
  )
}

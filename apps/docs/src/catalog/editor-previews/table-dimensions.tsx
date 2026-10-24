"use client"

import {
  EditorBlockPresentationExtension,
  EditorContent,
  EditorRoot,
  EditorTableDimensions,
  EditorTablePresentationExtension,
} from "@yopem-ui/editor"

const extensions = [
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorTableDimensions preview"
      extensions={extensions}
    >
      <EditorTableDimensions />
      <EditorContent />
    </EditorRoot>
  )
}

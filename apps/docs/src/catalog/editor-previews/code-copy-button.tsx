"use client"

import {
  EditorBlockPresentationExtension,
  EditorBlockButton,
  EditorContent,
  EditorRoot,
} from "@yopem-ui/editor"
import {
  EditorCodeCopyButton,
  EditorCodeStatus,
  EditorCodeExtension,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"

const extensions = [EditorBlockPresentationExtension, EditorCodeExtension]

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorCodeCopyButton preview"
      extensions={extensions}
    >
      <EditorCodeToolbar aria-label="Code tools">
        <EditorBlockButton block="code" />
        <EditorCodeCopyButton />
        <EditorCodeStatus />
      </EditorCodeToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

"use client"

import {
  EditorBlockPresentationExtension,
  EditorBlockButton,
  EditorContent,
  EditorRoot,
} from "@yopem-ui/editor"
import {
  EditorCodeCopyButton,
  EditorCodeExtension,
  EditorCodeStatus,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"

const extensions = [EditorBlockPresentationExtension, EditorCodeExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorCodeStatus preview" extensions={extensions}>
      <EditorCodeToolbar aria-label="Code tools">
        <EditorBlockButton block="code" />
        <EditorCodeStatus />
        <EditorCodeCopyButton />
      </EditorCodeToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

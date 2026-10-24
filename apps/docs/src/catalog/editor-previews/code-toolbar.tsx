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
  EditorCodeLanguage,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"

const extensions = [EditorBlockPresentationExtension, EditorCodeExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorCodeToolbar preview" extensions={extensions}>
      <EditorCodeToolbar aria-label="Code tools">
        <EditorBlockButton block="code" />
        <EditorCodeLanguage />
        <EditorCodeCopyButton />
        <EditorCodeStatus />
      </EditorCodeToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

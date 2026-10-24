"use client"

import {
  EditorBlockPresentationExtension,
  EditorBlockButton,
  EditorContent,
  EditorRoot,
} from "@yopem-ui/editor"
import {
  EditorCodeExtension,
  EditorCodeToggle,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"

const extensions = [EditorBlockPresentationExtension, EditorCodeExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorCodeToggle preview" extensions={extensions}>
      <EditorCodeToolbar aria-label="Code tools">
        <EditorBlockButton block="code" />
        <EditorCodeToggle setting="wrap" />
        <EditorCodeToggle setting="lineNumbers" />
      </EditorCodeToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

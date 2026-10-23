"use client"

import {
  EditorRoot,
  EditorContent,
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
  EditorBlockButton,
} from "@yopem-ui/editor"

export function EditorCompositionExamples() {
  return (
    <EditorRoot ariaLabel="Composed editor">
      <EditorToolbar aria-label="Custom formatting">
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorFormatButton format="subscript" />
        <EditorFormatButton format="superscript" />
        <EditorFormatButton format="highlight" />
        <EditorFormatButton format="uppercase" />
        <EditorFormatButton format="lowercase" />
        <EditorFormatButton format="capitalize" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
        <EditorBlockButton block="h2" />
      </EditorToolbar>
      <EditorContent placeholder="Write your notes…" />
    </EditorRoot>
  )
}

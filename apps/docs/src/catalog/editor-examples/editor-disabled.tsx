"use client"

import {
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

export function DisabledEditorExample() {
  return (
    <EditorRoot ariaLabel="Disabled editor" editable={false}>
      <EditorToolbar>
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorFormatButton format="underline" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent
        aria-disabled="true"
        tabIndex={-1}
        placeholder="Editing is disabled."
      />
    </EditorRoot>
  )
}

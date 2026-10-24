"use client"

import { EditorRoot, EditorContent, EditorToolbar } from "@yopem-ui/editor"
import { EditorEmojiMenu } from "@yopem-ui/editor/typeahead"

export function Preview() {
  return (
    <EditorRoot ariaLabel="EditorEmojiMenu preview">
      <EditorToolbar aria-label="Formatting">
        <EditorEmojiMenu />
      </EditorToolbar>
      <EditorContent placeholder="Click here, then open Emoji." />
    </EditorRoot>
  )
}

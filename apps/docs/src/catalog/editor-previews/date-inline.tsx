"use client"

import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import { EditorDateExtension } from "@yopem-ui/editor/date"

const extensions = [EditorDateExtension]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "paragraph",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [{ type: "editor-date", version: 1, date: "2024-01-01" }],
      },
    ],
  },
})

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="Date editor"
      extensions={extensions}
      initialState={initialState}
    >
      <EditorContent />
    </EditorRoot>
  )
}

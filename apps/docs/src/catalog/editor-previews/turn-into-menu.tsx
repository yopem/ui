"use client"

import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import { EditorTurnIntoMenu } from "@yopem-ui/editor/toolbar-menus"

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
        children: [
          {
            type: "text",
            version: 1,
            text: "Keep this paragraph",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

export function Preview() {
  return (
    <EditorRoot
      initialState={initialState}
      ariaLabel="Block conversion content"
    >
      <EditorToolbar>
        <EditorTurnIntoMenu aria-label="Block type" />
      </EditorToolbar>
      <EditorContent />
    </EditorRoot>
  )
}

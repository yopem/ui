"use client"

import {
  EditorContent,
  EditorHistoryButton,
  EditorLinkControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"

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
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Select text to add a link. Paste a safe URL over selected text to keep its label.",
          },
        ],
      },
    ],
  },
})

export function LinkExample() {
  return (
    <EditorRoot ariaLabel="Link editor" initialState={initialState}>
      <EditorToolbar>
        <EditorLinkControl />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent placeholder="Write link text…" />
    </EditorRoot>
  )
}

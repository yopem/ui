"use client"

import {
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
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
          { text: "Bold seed", format: 1 },
          { text: ", ", format: 0 },
          { text: "italic seed", format: 2 },
          { text: ", and ", format: 0 },
          { text: "underlined seed", format: 8 },
        ].map((text) => ({
          type: "text",
          version: 1,
          detail: 0,
          mode: "normal",
          style: "",
          ...text,
        })),
      },
    ],
  },
})

export function MarksSetupExample() {
  return (
    <EditorRoot ariaLabel="Marks setup editor" initialState={initialState}>
      <EditorToolbar>
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorFormatButton format="underline" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent placeholder="Select text to format it…" />
    </EditorRoot>
  )
}

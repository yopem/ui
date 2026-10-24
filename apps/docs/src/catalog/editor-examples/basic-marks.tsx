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
          { text: "Bold", format: 1 },
          { text: " and ", format: 0 },
          { text: "italic", format: 2 },
          { text: " text. Select text to change its marks.", format: 0 },
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

export function BasicMarksExample() {
  return (
    <EditorRoot ariaLabel="Basic marks editor" initialState={initialState}>
      <EditorToolbar>
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorFormatButton format="underline" />
        <EditorFormatButton format="strikethrough" />
        <EditorFormatButton format="code" />
        <EditorFormatButton format="highlight" />
        <EditorFormatButton format="subscript" />
        <EditorFormatButton format="superscript" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent placeholder="Write formatted text…" />
    </EditorRoot>
  )
}

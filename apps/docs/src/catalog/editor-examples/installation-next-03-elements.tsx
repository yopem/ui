"use client"

import {
  EditorBlockButton,
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
      { type: "heading", tag: "h1", text: "Element setup", format: 0 },
      { type: "paragraph", text: "Bold paragraph", format: 1 },
      { type: "quote", text: "A quoted idea", format: 2 },
    ].map(({ text, format, ...block }) => ({
      ...block,
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "text",
          version: 1,
          text,
          format,
          detail: 0,
          mode: "normal",
          style: "",
        },
      ],
    })),
  },
})

export function ElementsSetupExample() {
  return (
    <EditorRoot ariaLabel="Elements setup editor" initialState={initialState}>
      <EditorToolbar>
        <EditorBlockButton block="paragraph" />
        <EditorBlockButton block="h1" />
        <EditorBlockButton block="h2" />
        <EditorBlockButton block="h3" />
        <EditorBlockButton block="quote" />
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorFormatButton format="underline" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent placeholder="Choose a block type…" />
    </EditorRoot>
  )
}

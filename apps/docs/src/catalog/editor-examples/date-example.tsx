"use client"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { EditorDateControls, EditorDateExtension } from "@yopem-ui/editor/date"
import { useReducer } from "react"

const extensions = [EditorDateExtension]

const initialState = JSON.stringify({
  root: {
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
    children: [
      {
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Review on ",
            type: "text",
            version: 1,
          },
          { type: "editor-date", version: 1, date: "2024-01-02" },
        ],
      },
    ],
  },
})

export function DateExample() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  return (
    <Stack>
      <Button onClick={toggleEditable}>
        {editable ? "Read only" : "Edit document"}
      </Button>
      <EditorRoot
        ariaLabel="Date editor"
        editable={editable}
        extensions={extensions}
        initialState={initialState}
      >
        <EditorToolbar aria-label="Date tools">
          <EditorDateControls initialDate="2024-01-02" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent placeholder="Enter text and select a date" />
      </EditorRoot>
    </Stack>
  )
}

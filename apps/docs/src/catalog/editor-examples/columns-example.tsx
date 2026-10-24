"use client"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  EditorColumnsControls,
  EditorColumnsExtension,
} from "@yopem-ui/editor/columns"
import { useState } from "react"

const extensions = [EditorColumnsExtension]

const initialState = JSON.stringify({
  root: {
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
    children: [
      {
        type: "editor-columns-group",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        layout: [60, 40],
        children: [
          {
            type: "editor-column",
            version: 1,
            direction: null,
            format: "",
            indent: 0,
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
                    text: "Left column content",
                    type: "text",
                    version: 1,
                  },
                ],
              },
            ],
          },
          {
            type: "editor-column",
            version: 1,
            direction: null,
            format: "",
            indent: 0,
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
                    text: "Right column content",
                    type: "text",
                    version: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
})

export function ColumnsExample() {
  const [editable, setEditable] = useState(true)

  return (
    <Stack>
      <Button onClick={() => setEditable((current) => !current)}>
        {editable ? "Read only" : "Edit document"}
      </Button>
      <EditorRoot
        ariaLabel="Column editor"
        editable={editable}
        extensions={extensions}
        initialState={initialState}
      >
        <EditorToolbar aria-label="Column tools">
          <EditorColumnsControls />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent placeholder="Write in each column" />
      </EditorRoot>
    </Stack>
  )
}

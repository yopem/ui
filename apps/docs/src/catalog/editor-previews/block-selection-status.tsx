"use client"

import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import {
  createEditorBlockSelection,
  EditorBlockSelection,
  EditorBlockSelectionGutter,
  EditorBlockSelectionStatus,
} from "@yopem-ui/editor/block-selection"
import { useState } from "react"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: ["First block", "Second block", "Third block"].map((text) => ({
      type: "paragraph",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "text",
          version: 1,
          text,
          format: 0,
          detail: 0,
          mode: "normal",
          style: "",
        },
      ],
    })),
  },
})

export function Preview() {
  const [setup] = useState(() => {
    const controller = createEditorBlockSelection()

    return { controller, extensions: [controller.extension] }
  })

  return (
    <EditorRoot
      ariaLabel="Block selection status editor"
      initialState={initialState}
      extensions={setup.extensions}
    >
      <EditorBlockSelection controller={setup.controller}>
        <EditorBlockSelectionGutter />
        <EditorContent placeholder="Select blocks to update the status" />
        <EditorBlockSelectionStatus />
      </EditorBlockSelection>
    </EditorRoot>
  )
}

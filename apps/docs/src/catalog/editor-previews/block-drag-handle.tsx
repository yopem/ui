"use client"

import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import {
  createEditorBlockSelection,
  EditorBlockDragHandle,
  EditorBlockSelection,
  EditorBlockSelectionGutter,
  useEditorBlockSelection,
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

function FirstBlockDragHandle() {
  const { state } = useEditorBlockSelection()
  const blockKey = state.blocks[0]

  return blockKey ? (
    <EditorBlockDragHandle blockKey={blockKey} label="Drag first block" />
  ) : null
}

export function Preview() {
  const [setup] = useState(() => {
    const controller = createEditorBlockSelection()

    return { controller, extensions: [controller.extension] }
  })

  return (
    <EditorRoot
      ariaLabel="Block drag handle editor"
      initialState={initialState}
      extensions={setup.extensions}
    >
      <EditorBlockSelection controller={setup.controller}>
        <FirstBlockDragHandle />
        <EditorBlockSelectionGutter />
        <EditorContent placeholder="Drag a handle to reorder blocks" />
      </EditorBlockSelection>
    </EditorRoot>
  )
}

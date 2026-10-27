"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  createEditorBlockSelection,
  EditorBlockSelection,
  EditorBlockSelectionActions,
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
    children: ["First block", "Second block", "Third block"].map(
      (text, index) => ({
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
            format: index === 0 ? 1 : 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      }),
    ),
  },
})

export function PublicSelectionExample() {
  const [editable, setEditable] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  const [setup] = useState(() => {
    const controller = createEditorBlockSelection({
      authorizeCut: () => window.confirm("Cut selected blocks?"),
    })

    return { controller, extensions: [controller.extension] }
  })

  return (
    <Stack>
      <Text>
        Select top-level blocks with pointer or Shift. Drag a handle or use the
        move controls. Cut asks for local confirmation, not document
        authorization.
      </Text>
      <Button variant="outline" onClick={toggleEditable}>
        {editable ? "Read-only selection" : "Enable selection editing"}
      </Button>
      <EditorRoot
        ariaLabel="Public block selection editor"
        editable={editable}
        initialState={initialState}
        extensions={setup.extensions}
      >
        <EditorBlockSelection controller={setup.controller}>
          <EditorToolbar aria-label="History controls">
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorBlockSelectionActions />
          <EditorBlockSelectionGutter />
          <EditorContent placeholder="Enter block content" />
          <EditorBlockSelectionStatus />
        </EditorBlockSelection>
      </EditorRoot>
    </Stack>
  )
}

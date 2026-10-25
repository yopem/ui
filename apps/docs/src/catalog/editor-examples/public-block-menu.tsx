"use client"

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
  createEditorBlockMenu,
  EditorBlockMenu,
} from "@yopem-ui/editor/block-menu"
import { useState } from "react"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: ["First block", "Second block"].map((text) => ({
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

export function PublicBlockMenuExample() {
  const [editable, setEditable] = useState(true)

  const [toggleEditable] = useState(() => {
    return function toggleEditable() {
      setEditable((current) => !current)
    }
  })

  const [setup] = useState(() => {
    const controller = createEditorBlockMenu()

    return { controller, extensions: [controller.extension] }
  })

  return (
    <Stack>
      <Text>
        Right-click a text block or press Shift+F10. Host actions appear only
        when the host supplies a callback.
      </Text>
      <Button variant="outline" onClick={toggleEditable}>
        {editable
          ? "Make block menu editor read-only"
          : "Make block menu editor editable"}
      </Button>
      <EditorRoot
        ariaLabel="Public block menu editor"
        editable={editable}
        initialState={initialState}
        extensions={setup.extensions}
      >
        <EditorToolbar aria-label="Block menu history">
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorBlockMenu controller={setup.controller}>
          <EditorContent placeholder="Enter block content" />
        </EditorBlockMenu>
      </EditorRoot>
    </Stack>
  )
}

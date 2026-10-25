"use client"

import { Button } from "@registry/components/ui/button"
import { HStack } from "@registry/components/ui/hstack"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { EditorCursorOverlay } from "@yopem-ui/editor/cursor-overlay"
import { useReducer } from "react"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
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
            text: "Select this text, then move focus to the toolbar.",
            format: 0,
            detail: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

function toggleState(current: boolean) {
  return !current
}

export function PublicCursorsExample() {
  const [editable, toggleEditable] = useReducer(toggleState, true)
  const [overlayMounted, toggleOverlay] = useReducer(toggleState, true)

  return (
    <Stack>
      <Text>
        Drag text into the editor to see the native drop caret. Select text,
        then tab to a toolbar control to see its retained highlight. Native
        keyboard editing remains unchanged. This example has no AI host or
        acceptance action.
      </Text>
      <HStack>
        <Button type="button" variant="outline" onClick={toggleEditable}>
          {editable ? "Make editor read-only" : "Restore editing"}
        </Button>
        <Button type="button" variant="outline" onClick={toggleOverlay}>
          {overlayMounted ? "Unmount cursor overlay" : "Mount cursor overlay"}
        </Button>
      </HStack>
      <EditorRoot
        ariaLabel="Public cursor overlay editor"
        editable={editable}
        initialState={initialState}
      >
        <EditorToolbar aria-label="Editor controls">
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
          <Button variant="outline" type="button">
            Focused toolbar control
          </Button>
        </EditorToolbar>
        <EditorContent placeholder="Enter text" />
        {overlayMounted ? <EditorCursorOverlay /> : null}
      </EditorRoot>
    </Stack>
  )
}

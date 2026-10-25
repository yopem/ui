"use client"

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

export function EditorBlockMenuComposition() {
  const [setup] = useState(() => {
    const controller = createEditorBlockMenu()

    return {
      controller,
      extensions: [controller.extension],
    }
  })

  return (
    <EditorRoot
      ariaLabel="Block menu editor"
      extensions={setup.extensions}
      initialState={initialState}
    >
      <EditorBlockMenu controller={setup.controller}>
        <Stack>
          <Text>
            Right-click a block or press Shift+F10. Use Undo and Redo for native
            editor history.
          </Text>
          <EditorToolbar aria-label="Block menu history">
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent placeholder="Write a block…" />
        </Stack>
      </EditorBlockMenu>
    </EditorRoot>
  )
}

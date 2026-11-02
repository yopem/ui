"use client"

import { Box } from "@registry/components/ui/box"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { EditorContent, EditorFormatButton, EditorRoot } from "@yopem-ui/editor"
import { EditorFloatingToolbar } from "@yopem-ui/editor/floating-toolbar"
import { EditorFloatingToolbarButtons } from "@yopem-ui/editor/toolbar-menus"
import { useState } from "react"

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
          {
            type: "text",
            version: 1,
            text: "Select this text to open grouped floating controls.",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
})

export function Preview() {
  const [showDisabled, setShowDisabled] = useState(false)

  return (
    <Stack>
      <Box render={<details />}>
        <Box render={<summary aria-label="Advanced host checks" />}>
          Advanced host checks
        </Box>
        <Label>
          <Checkbox checked={showDisabled} onCheckedChange={setShowDisabled} />
          Show disabled controls
        </Label>
      </Box>
      <EditorRoot
        initialState={initialState}
        ariaLabel="Grouped floating document"
      >
        <EditorContent />
        <EditorFloatingToolbar aria-label="Grouped floating formatting">
          {showDisabled && (
            <>
              <EditorFormatButton
                format="bold"
                aria-label="Unavailable bold"
                disabled
              />
              <EditorFormatButton
                format="italic"
                aria-label="Unavailable italic"
                disabled
                focusableWhenDisabled={false}
              />
            </>
          )}
          <EditorFloatingToolbarButtons />
        </EditorFloatingToolbar>
      </EditorRoot>
    </Stack>
  )
}

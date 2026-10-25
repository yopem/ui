"use client"

import { Box } from "@registry/components/ui/box"
import { HStack } from "@registry/components/ui/hstack"
import { Stack } from "@registry/components/ui/stack"
import { EditorContent, EditorRoot } from "@yopem-ui/editor"
import {
  EditorSearchInput,
  EditorSearchNextButton,
  EditorSearchPreviousButton,
  EditorSearchRoot,
  EditorSearchStatus,
  EditorSearchViewport,
} from "@yopem-ui/editor/search"

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
            text: "This is editable text that you can search. As you search, it looks for matching strings of text, and adds decorations to them in real time.",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
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
            text: "Try it out for yourself by typing in the search box above!",
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

export function PublicSearchExample() {
  return (
    <Box data-testid="public-search-example">
      <EditorRoot ariaLabel="Search editor" initialState={initialState}>
        <EditorSearchRoot initialQuery="text">
          <Stack>
            <EditorSearchInput placeholder="Search the text…" />
            <HStack>
              <EditorSearchPreviousButton />
              <EditorSearchNextButton />
              <EditorSearchStatus />
            </HStack>
            <EditorSearchViewport>
              <EditorContent placeholder="Write your document…" />
            </EditorSearchViewport>
          </Stack>
        </EditorSearchRoot>
      </EditorRoot>
    </Box>
  )
}

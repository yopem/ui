"use client"

import type { ReactNode } from "react"

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
            text: "This is searchable text. Search this text.",
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

export function SearchExample({
  ariaLabel = "Search editor",
  children,
  editable = true,
}: {
  ariaLabel?: string
  children?: ReactNode
  editable?: boolean
}) {
  return (
    <Box data-testid="editor-search-example">
      <EditorRoot
        ariaLabel={ariaLabel}
        editable={editable}
        initialState={initialState}
      >
        <EditorSearchRoot initialQuery="text">
          <Stack>
            {children ?? (
              <>
                <EditorSearchInput placeholder="Search the text…" />
                <HStack>
                  <EditorSearchPreviousButton />
                  <EditorSearchNextButton />
                  <EditorSearchStatus />
                </HStack>
              </>
            )}
            <EditorSearchViewport>
              <EditorContent placeholder="Write your document…" />
            </EditorSearchViewport>
          </Stack>
        </EditorSearchRoot>
      </EditorRoot>
    </Box>
  )
}

"use client"

import type { MediaUpload } from "@yopem-ui/editor/media"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Wrap } from "@registry/components/ui/wrap"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import {
  createMediaExtension,
  MediaInsertControl,
  mediaKinds,
} from "@yopem-ui/editor/media"
import { useReducer } from "react"

const extensions = [
  createMediaExtension({ embedPolicy: { providers: ["vimeo"] } }),
]

export function EditorMediaExample({ upload }: { upload?: MediaUpload }) {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  return (
    <Box render={<section />} aria-label="Media editor">
      <Button onClick={toggleEditable}>
        {editable ? "Read only" : "Edit media"}
      </Button>
      <EditorRoot
        ariaLabel="Media content"
        editable={editable}
        extensions={extensions}
      >
        <EditorToolbar>
          <Wrap>
            {mediaKinds.map((kind) => (
              <MediaInsertControl key={kind} kind={kind} upload={upload} />
            ))}
          </Wrap>
        </EditorToolbar>
        <EditorContent placeholder="Select an insertion point." />
      </EditorRoot>
    </Box>
  )
}

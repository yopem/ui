"use client"

import type { MediaUpload } from "@yopem-ui/editor/media"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Wrap } from "@registry/components/ui/wrap"
import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import {
  MediaExtension,
  MediaInsertControl,
  mediaKinds,
} from "@yopem-ui/editor/media"
import { useState } from "react"

const extensions = [MediaExtension]

export function EditorMediaExample({ upload }: { upload?: MediaUpload }) {
  const [editable, setEditable] = useState(true)

  return (
    <Box render={<section />} aria-label="Media editor">
      <Button onClick={() => setEditable(!editable)}>
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

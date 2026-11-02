"use client"

import type { MediaUpload } from "@yopem-ui/editor/media"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  MediaExtension,
  MediaInsertControl,
  mediaKinds,
} from "@yopem-ui/editor/media"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { useState } from "react"

const extensions = [MediaExtension]

const initialState = JSON.stringify({
  root: {
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
    children: [
      {
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Inspect the seeded mark, then add supported media from a safe HTTPS URL.",
            type: "text",
            version: 1,
          },
        ],
      },
      {
        type: "yopem-media",
        version: 1,
        media: {
          kind: "image",
          url: "https://ui.yopem.com/favicon.svg",
          alt: "Yopem UI mark",
          caption: "Yopem UI mark",
          name: "File",
          width: 240,
          alignment: "center",
        },
      },
      {
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Insert image, video, audio, file, or supported provider content.",
            type: "text",
            version: 1,
          },
        ],
      },
    ],
  },
})

export function MediaExample({ upload }: { upload?: MediaUpload }) {
  const [editable, setEditable] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  return (
    <Stack>
      <Button onClick={toggleEditable}>
        {editable ? "Read only" : "Edit document"}
      </Button>
      <EditorRoot
        ariaLabel="Media editor"
        editable={editable}
        extensions={extensions}
        initialState={initialState}
      >
        <EditorToolbar aria-label="Media tools">
          <Wrap>
            {mediaKinds.map((kind) => (
              <MediaInsertControl key={kind} kind={kind} upload={upload} />
            ))}
          </Wrap>
          <EditorHistoryButton
            action="undo"
            aria-label="Undo"
            title="Undo"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Undo2Icon aria-hidden="true" size={16} />
          </EditorHistoryButton>
          <EditorHistoryButton
            action="redo"
            aria-label="Redo"
            title="Redo"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Redo2Icon aria-hidden="true" size={16} />
          </EditorHistoryButton>
        </EditorToolbar>
        <EditorContent placeholder="Select an insertion point." />
      </EditorRoot>
    </Stack>
  )
}

"use client"

import { Button } from "@registry/components/ui/button"
import {
  EditorContent,
  EditorHistoryButton,
  EditorLinkControl,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import { LinkIcon, Redo2Icon, Undo2Icon } from "lucide-react"

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
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Select text to add a link. Paste a safe URL over selected text to keep its label.",
          },
        ],
      },
    ],
  },
})

export function LinkExample() {
  return (
    <EditorRoot ariaLabel="Link editor" initialState={initialState}>
      <EditorToolbar>
        <EditorLinkControl
          aria-label="Link"
          title="Link"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <LinkIcon aria-hidden="true" size={16} />
        </EditorLinkControl>
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
      <EditorContent placeholder="Write link text…" />
    </EditorRoot>
  )
}

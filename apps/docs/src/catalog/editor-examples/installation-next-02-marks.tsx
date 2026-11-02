"use client"

import { Button } from "@registry/components/ui/button"
import {
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  BoldIcon,
  ItalicIcon,
  Redo2Icon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react"

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
          { text: "Bold seed", format: 1 },
          { text: ", ", format: 0 },
          { text: "italic seed", format: 2 },
          { text: ", and ", format: 0 },
          { text: "underlined seed", format: 8 },
        ].map((text) => ({
          type: "text",
          version: 1,
          detail: 0,
          mode: "normal",
          style: "",
          ...text,
        })),
      },
    ],
  },
})

export function MarksSetupExample() {
  return (
    <EditorRoot ariaLabel="Marks setup editor" initialState={initialState}>
      <EditorToolbar>
        <EditorFormatButton
          format="bold"
          title="Bold"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <BoldIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
        <EditorFormatButton
          format="italic"
          title="Italic"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <ItalicIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
        <EditorFormatButton
          format="underline"
          title="Underline"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <UnderlineIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
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
      <EditorContent placeholder="Select text to format it…" />
    </EditorRoot>
  )
}

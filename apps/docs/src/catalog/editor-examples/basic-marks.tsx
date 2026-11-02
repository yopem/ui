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
  CodeIcon,
  HighlighterIcon,
  ItalicIcon,
  Redo2Icon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
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
          { text: "Bold", format: 1 },
          { text: " and ", format: 0 },
          { text: "italic", format: 2 },
          { text: " text. Select text to change its marks.", format: 0 },
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

export function BasicMarksExample() {
  return (
    <EditorRoot ariaLabel="Basic marks editor" initialState={initialState}>
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
        <EditorFormatButton
          format="strikethrough"
          title="Strikethrough"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <StrikethroughIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
        <EditorFormatButton
          format="code"
          title="Inline code"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <CodeIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
        <EditorFormatButton
          format="highlight"
          title="Highlight"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <HighlighterIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
        <EditorFormatButton
          format="subscript"
          title="Subscript"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <SubscriptIcon aria-hidden="true" size={16} />
        </EditorFormatButton>
        <EditorFormatButton
          format="superscript"
          title="Superscript"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <SuperscriptIcon aria-hidden="true" size={16} />
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
      <EditorContent placeholder="Write formatted text…" />
    </EditorRoot>
  )
}

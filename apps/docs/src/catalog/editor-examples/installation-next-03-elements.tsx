"use client"

import { Button } from "@registry/components/ui/button"
import {
  EditorBlockButton,
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  PilcrowIcon,
  QuoteIcon,
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
      { type: "heading", tag: "h1", text: "Element setup", format: 0 },
      { type: "paragraph", text: "Bold paragraph", format: 1 },
      { type: "quote", text: "A quoted idea", format: 2 },
    ].map(({ text, format, ...block }) => ({
      ...block,
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "text",
          version: 1,
          text,
          format,
          detail: 0,
          mode: "normal",
          style: "",
        },
      ],
    })),
  },
})

export function ElementsSetupExample() {
  return (
    <EditorRoot ariaLabel="Elements setup editor" initialState={initialState}>
      <EditorToolbar>
        <EditorBlockButton
          block="paragraph"
          aria-label="Paragraph"
          title="Paragraph"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <PilcrowIcon aria-hidden="true" size={16} />
        </EditorBlockButton>
        <EditorBlockButton
          block="h1"
          aria-label="Heading 1"
          title="Heading 1"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <Heading1Icon aria-hidden="true" size={16} />
        </EditorBlockButton>
        <EditorBlockButton
          block="h2"
          aria-label="Heading 2"
          title="Heading 2"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <Heading2Icon aria-hidden="true" size={16} />
        </EditorBlockButton>
        <EditorBlockButton
          block="h3"
          aria-label="Heading 3"
          title="Heading 3"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <Heading3Icon aria-hidden="true" size={16} />
        </EditorBlockButton>
        <EditorBlockButton
          block="quote"
          aria-label="Quote"
          title="Quote"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <QuoteIcon aria-hidden="true" size={16} />
        </EditorBlockButton>
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
      <EditorContent placeholder="Choose a block type…" />
    </EditorRoot>
  )
}

"use client"

import { Button } from "@registry/components/ui/button"
import { ToolbarSeparator } from "@registry/components/ui/toolbar"
import {
  BoldIcon,
  CodeIcon,
  FileCode2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  TableIcon,
  TablePropertiesIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react"

import type { EditorProps } from "./extension"

import {
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
  EditorBlockButton,
  EditorListButton,
  EditorIndentButton,
  EditorTableButton,
} from "./controls"
import { EditorLinkControl } from "./link-control"
import { EditorRoot, EditorContent } from "./root"
import { EditorTableMenu } from "./table-controls"

export function Editor({ placeholder, ...props }: EditorProps) {
  return (
    <EditorRoot {...props}>
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
        <ToolbarSeparator />
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
        <ToolbarSeparator />
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
        <EditorBlockButton
          block="code"
          aria-label="Code block"
          title="Code block"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <FileCode2Icon aria-hidden="true" size={16} />
        </EditorBlockButton>
        <ToolbarSeparator />
        <EditorListButton
          listType="bullet"
          aria-label="Bullet list"
          title="Bullet list"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <ListIcon aria-hidden="true" size={16} />
        </EditorListButton>
        <EditorListButton
          listType="number"
          aria-label="Numbered list"
          title="Numbered list"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <ListOrderedIcon aria-hidden="true" size={16} />
        </EditorListButton>
        <EditorListButton
          listType="check"
          aria-label="Checklist"
          title="Checklist"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <ListChecksIcon aria-hidden="true" size={16} />
        </EditorListButton>
        <EditorIndentButton
          direction="indent"
          aria-label="Indent"
          title="Indent"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <IndentIncreaseIcon aria-hidden="true" size={16} />
        </EditorIndentButton>
        <EditorIndentButton
          direction="outdent"
          aria-label="Outdent"
          title="Outdent"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <IndentDecreaseIcon aria-hidden="true" size={16} />
        </EditorIndentButton>
        <ToolbarSeparator />
        <EditorLinkControl
          aria-label="Link"
          title="Link"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <LinkIcon aria-hidden="true" size={16} />
        </EditorLinkControl>
        <EditorTableButton
          aria-label="Insert table"
          title="Insert table"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <TableIcon aria-hidden="true" size={16} />
        </EditorTableButton>
        <EditorTableMenu
          aria-label="Table actions"
          title="Table actions"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <TablePropertiesIcon aria-hidden="true" size={16} />
        </EditorTableMenu>
      </EditorToolbar>
      <EditorContent placeholder={placeholder} />
    </EditorRoot>
  )
}

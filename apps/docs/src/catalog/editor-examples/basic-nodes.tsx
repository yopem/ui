"use client"

import type { MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import {
  HorizontalRuleExtension,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from "@lexical/extension"
import { Button } from "@registry/components/ui/button"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorBlockButton,
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import { defineExtension } from "lexical"
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HighlighterIcon,
  ItalicIcon,
  MinusIcon,
  PilcrowIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react"

function preventToolbarBlur(event: MouseEvent<HTMLElement>) {
  event.preventDefault()
}

const styles = stylex.create({
  rule: {
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: tokens["--border"],
    marginBlock: `calc(${tokens["--spacing"]} * 4)`,
  },
  selectedRule: {
    outlineWidth: 2,
    outlineStyle: "solid",
    outlineColor: tokens["--ring"],
    outlineOffset: 2,
  },
})

const extensions = [
  defineExtension({
    name: "editor-examples/basic-nodes",
    dependencies: [HorizontalRuleExtension],
    theme: {
      hr: stylex.props(styles.rule).className,
      hrSelected: stylex.props(styles.selectedRule).className,
    },
  }),
]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      { type: "heading", tag: "h1", text: "Document title", format: 0 },
      {
        type: "paragraph",
        text: "Select this bold paragraph to change its block or marks.",
        format: 1,
      },
      {
        type: "quote",
        text: "Keep the original content when you change a block.",
        format: 2,
      },
      { type: "heading", tag: "h2", text: "Section heading", format: 0 },
      { type: "heading", tag: "h3", text: "Subsection heading", format: 0 },
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

function HorizontalRuleButton() {
  const editor = useEditor()
  const { editable } = useEditorState()

  const insertHorizontalRule = useStableCallback(
    function insertHorizontalRule() {
      if (!editor.isEditable()) return
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
      editor.focus()
    },
  )

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="icon-sm" />}
      disabled={!editable}
      onMouseDown={preventToolbarBlur}
      onClick={insertHorizontalRule}
      aria-label="Insert horizontal rule"
      title="Insert horizontal rule"
    >
      <MinusIcon aria-hidden="true" size={16} />
    </ToolbarButton>
  )
}

export function BasicNodesExample() {
  return (
    <EditorRoot
      ariaLabel="Basic nodes editor"
      initialState={initialState}
      extensions={extensions}
    >
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
        <HorizontalRuleButton />
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
      <EditorContent placeholder="Write a structured document…" />
    </EditorRoot>
  )
}

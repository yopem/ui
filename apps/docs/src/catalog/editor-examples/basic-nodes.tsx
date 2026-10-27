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
      render={<Button variant="ghost" size="sm" />}
      disabled={!editable}
      onMouseDown={preventToolbarBlur}
      onClick={insertHorizontalRule}
    >
      Insert horizontal rule
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
        <EditorBlockButton block="paragraph" />
        <EditorBlockButton block="h1" />
        <EditorBlockButton block="h2" />
        <EditorBlockButton block="h3" />
        <EditorBlockButton block="quote" />
        <HorizontalRuleButton />
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorFormatButton format="underline" />
        <EditorFormatButton format="strikethrough" />
        <EditorFormatButton format="code" />
        <EditorFormatButton format="highlight" />
        <EditorFormatButton format="subscript" />
        <EditorFormatButton format="superscript" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
      <EditorContent placeholder="Write a structured document…" />
    </EditorRoot>
  )
}

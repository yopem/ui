"use client"

import type { LexicalCommand, TextFormatType } from "lexical"
import type { ComponentProps } from "react"

import { $createCodeNode } from "@lexical/code"
import {
  $removeList,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { INSERT_TABLE_COMMAND } from "@lexical/table"
import { Button } from "@registry/components/ui/button"
import { Toolbar, ToolbarButton } from "@registry/components/ui/toolbar"
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"

import { useEditor, useEditorState } from "./root"
import { editorStyles } from "./theme"

export type EditorToolbarProps = ComponentProps<typeof Toolbar>

export type EditorControlProps = ComponentProps<typeof ToolbarButton>

export function EditorToolbar({
  xstyle,
  disabled,
  "aria-label": label,
  ...props
}: EditorToolbarProps) {
  const state = useEditorState()

  return (
    <Toolbar
      {...props}
      aria-label={label ?? `${state.ariaLabel} formatting`}
      disabled={disabled === true || !state.editable}
      xstyle={[editorStyles.toolbar, xstyle]}
    />
  )
}

export function EditorCommandButton({
  children,
  disabled,
  onClick,
  onMouseDown,
  command,
  ...props
}: EditorControlProps & { command: () => void }) {
  const editor = useEditor()
  const { editable } = useEditorState()

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      disabled={disabled === true || !editable}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled === true || !editor.isEditable())
          return
        command()
        editor.focus()
      }}
    >
      {children}
    </ToolbarButton>
  )
}

const formatLabels: Record<TextFormatType, string> = {
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
  code: "Inline code",
  subscript: "Subscript",
  superscript: "Superscript",
  highlight: "Highlight",
  lowercase: "Lowercase",
  uppercase: "Uppercase",
  capitalize: "Capitalize",
}

export type EditorFormatButtonProps = EditorControlProps & {
  format: TextFormatType
}

export function EditorFormatButton({
  format,
  children,
  "aria-label": label = formatLabels[format],
  ...props
}: EditorFormatButtonProps) {
  const editor = useEditor()
  const state = useEditorState()

  return (
    <EditorCommandButton
      aria-label={label}
      aria-pressed={state.formats.includes(format)}
      {...props}
      command={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
    >
      {children ?? label}
    </EditorCommandButton>
  )
}

export type EditorHistoryButtonProps = EditorControlProps & {
  action: "undo" | "redo"
}

export function EditorHistoryButton({
  action,
  children,
  disabled,
  ...props
}: EditorHistoryButtonProps) {
  const editor = useEditor()
  const state = useEditorState()

  return (
    <EditorCommandButton
      {...props}
      disabled={
        disabled === true ||
        !(action === "undo" ? state.canUndo : state.canRedo)
      }
      command={() =>
        editor.dispatchCommand(
          action === "undo" ? UNDO_COMMAND : REDO_COMMAND,
          undefined,
        )
      }
    >
      {children ?? (action === "undo" ? "Undo" : "Redo")}
    </EditorCommandButton>
  )
}

export type EditorBlockButtonProps = EditorControlProps & {
  block:
    | "paragraph"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "quote"
    | "code"
}

const blockLabels = {
  paragraph: "Paragraph",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  quote: "Quote",
  code: "Code block",
}

export function EditorBlockButton({
  block,
  children,
  ...props
}: EditorBlockButtonProps) {
  const editor = useEditor()

  return (
    <EditorCommandButton
      {...props}
      command={() =>
        editor.update(() => {
          $removeList()
          const selection = $getSelection()

          if (!$isRangeSelection(selection)) return
          $setBlocksType(selection, () => {
            switch (block) {
              case "paragraph":
                return $createParagraphNode()
              case "quote":
                return $createQuoteNode()
              case "code":
                return $createCodeNode()
              default:
                return $createHeadingNode(block)
            }
          })
        })
      }
    >
      {children ?? blockLabels[block]}
    </EditorCommandButton>
  )
}

export type EditorListButtonProps = EditorControlProps & {
  listType: "bullet" | "number" | "check"
}

const listCommands: Record<
  EditorListButtonProps["listType"],
  LexicalCommand<void>
> = {
  bullet: INSERT_UNORDERED_LIST_COMMAND,
  number: INSERT_ORDERED_LIST_COMMAND,
  check: INSERT_CHECK_LIST_COMMAND,
}

const listLabels = {
  bullet: "Bullet list",
  number: "Numbered list",
  check: "Checklist",
}

export function EditorListButton({
  listType,
  children,
  ...props
}: EditorListButtonProps) {
  const editor = useEditor()

  return (
    <EditorCommandButton
      {...props}
      command={() => editor.dispatchCommand(listCommands[listType], undefined)}
    >
      {children ?? listLabels[listType]}
    </EditorCommandButton>
  )
}

export type EditorIndentButtonProps = EditorControlProps & {
  direction: "indent" | "outdent"
}

export function EditorIndentButton({
  direction,
  children,
  ...props
}: EditorIndentButtonProps) {
  const editor = useEditor()

  return (
    <EditorCommandButton
      {...props}
      command={() =>
        editor.dispatchCommand(
          direction === "indent"
            ? INDENT_CONTENT_COMMAND
            : OUTDENT_CONTENT_COMMAND,
          undefined,
        )
      }
    >
      {children ?? (direction === "indent" ? "Indent" : "Outdent")}
    </EditorCommandButton>
  )
}

export type EditorTableButtonProps = EditorControlProps

export function EditorTableButton({
  children = "Insert table",
  ...props
}: EditorTableButtonProps) {
  const editor = useEditor()

  return (
    <EditorCommandButton
      {...props}
      command={() =>
        editor.dispatchCommand(INSERT_TABLE_COMMAND, {
          columns: "3",
          rows: "3",
          includeHeaders: true,
        })
      }
    >
      {children}
    </EditorCommandButton>
  )
}

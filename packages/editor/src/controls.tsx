"use client"

import type { StyleXStyle } from "@registry/lib/stylex"
import type { LexicalCommand, TextFormatType } from "lexical"
import type { ComponentProps } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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
  const toolbarXstyle: StyleXStyle = [editorStyles.toolbar, xstyle]

  return (
    <Toolbar
      {...props}
      aria-label={label ?? `${state.ariaLabel} formatting`}
      disabled={disabled === true || !state.editable}
      xstyle={toolbarXstyle}
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

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<NonNullable<typeof onMouseDown>>[0],
  ) {
    onMouseDown?.(event)
    event.preventDefault()
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<NonNullable<typeof onClick>>[0],
  ) {
    onClick?.(event)

    if (event.defaultPrevented || disabled === true || !editor.isEditable())
      return
    command()
    editor.focus()
  })

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      {...props}
      disabled={disabled === true || !editable}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
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

  function command() {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  return (
    <EditorCommandButton
      aria-label={label}
      aria-pressed={state.formats.includes(format)}
      {...props}
      command={command}
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

  function command() {
    editor.dispatchCommand(
      action === "undo" ? UNDO_COMMAND : REDO_COMMAND,
      undefined,
    )
  }

  return (
    <EditorCommandButton
      {...props}
      disabled={
        disabled === true ||
        !(action === "undo" ? state.canUndo : state.canRedo)
      }
      command={command}
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

  function command() {
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

  return (
    <EditorCommandButton {...props} command={command}>
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

  function command() {
    editor.dispatchCommand(listCommands[listType], undefined)
  }

  return (
    <EditorCommandButton {...props} command={command}>
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

  function command() {
    editor.dispatchCommand(
      direction === "indent" ? INDENT_CONTENT_COMMAND : OUTDENT_CONTENT_COMMAND,
      undefined,
    )
  }

  return (
    <EditorCommandButton {...props} command={command}>
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

  function command() {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: "3",
      rows: "3",
      includeHeaders: true,
    })
  }

  return (
    <EditorCommandButton {...props} command={command}>
      {children}
    </EditorCommandButton>
  )
}

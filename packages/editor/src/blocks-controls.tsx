"use client"

import type { LexicalCommand } from "lexical"

import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { HISTORY_PUSH_TAG } from "lexical"
import { useState, useSyncExternalStore } from "react"

import type { EditorCalloutAppearance } from "./blocks-model"
import type { EditorControlProps } from "./controls"

import {
  CONVERT_EDITOR_BLOCK_COMMAND,
  INSERT_EDITOR_CALLOUT_COMMAND,
  INSERT_EDITOR_TOGGLE_COMMAND,
  REMOVE_EDITOR_BLOCK_COMMAND,
  TOGGLE_EDITOR_DISCLOSURE_COMMAND,
  UPDATE_EDITOR_CALLOUT_COMMAND,
} from "./blocks-extension"
import { editorCalloutAppearances, isEditorCalloutIcon } from "./blocks-model"
import { EditorHistoryButton } from "./controls"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

function EditorBlocksCommandButton({
  command,
  children,
  disabled,
  onClick,
  onMouseDown,
  ...props
}: EditorControlProps & { command: LexicalCommand<void> }) {
  const editor = useEditor()
  const { editable } = useEditorState()

  return (
    <ToolbarButton
      {...props}
      render={<Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled || !editor.isEditable()) return
        editor.update(
          () => {
            editor.dispatchCommand(command, undefined)
          },
          { tag: HISTORY_PUSH_TAG },
        )
        editor.focus()
      }}
    >
      {children}
    </ToolbarButton>
  )
}

export function EditorCalloutButton(props: EditorControlProps) {
  return (
    <EditorBlocksCommandButton
      command={INSERT_EDITOR_CALLOUT_COMMAND}
      {...props}
    >
      {props.children ?? "Insert callout"}
    </EditorBlocksCommandButton>
  )
}

export function EditorToggleButton(props: EditorControlProps) {
  return (
    <EditorBlocksCommandButton
      command={INSERT_EDITOR_TOGGLE_COMMAND}
      {...props}
    >
      {props.children ?? "Insert toggle"}
    </EditorBlocksCommandButton>
  )
}

export function EditorRemoveBlockButton(props: EditorControlProps) {
  return (
    <EditorBlocksCommandButton command={REMOVE_EDITOR_BLOCK_COMMAND} {...props}>
      {props.children ?? "Remove block"}
    </EditorBlocksCommandButton>
  )
}

export function EditorDisclosureButton(props: EditorControlProps) {
  return (
    <EditorBlocksCommandButton
      command={TOGGLE_EDITOR_DISCLOSURE_COMMAND}
      {...props}
    >
      {props.children ?? "Toggle disclosure"}
    </EditorBlocksCommandButton>
  )
}

export function EditorCalloutAppearanceButton({
  appearance,
  disabled,
  children,
  onMouseDown,
  onClick,
  ...props
}: EditorControlProps & { appearance: EditorCalloutAppearance }) {
  const editor = useEditor()
  const { editable } = useEditorState()

  return (
    <ToolbarButton
      {...props}
      render={<Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled || !editor.isEditable()) return
        editor.update(
          () => {
            editor.dispatchCommand(UPDATE_EDITOR_CALLOUT_COMMAND, {
              appearance,
            })
          },
          { tag: HISTORY_PUSH_TAG },
        )
        editor.focus()
      }}
    >
      {children ?? `Callout appearance ${appearance}`}
    </ToolbarButton>
  )
}

export function EditorBlockTypeButton({
  kind,
  disabled,
  children,
  onMouseDown,
  onClick,
  ...props
}: EditorControlProps & { kind: "callout" | "toggle" }) {
  const editor = useEditor()
  const { editable } = useEditorState()

  return (
    <ToolbarButton
      {...props}
      render={<Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
      onClick={(event) => {
        onClick?.(event)

        if (event.defaultPrevented || disabled || !editor.isEditable()) return
        editor.update(
          () => {
            editor.dispatchCommand(CONVERT_EDITOR_BLOCK_COMMAND, kind)
          },
          { tag: HISTORY_PUSH_TAG },
        )
        editor.focus()
      }}
    >
      {children ?? `Convert to ${kind}`}
    </ToolbarButton>
  )
}

export function EditorCalloutIconControl() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [value, setValue] = useState("💡")
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))

  const hasSelection = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const valid = isEditorCalloutIcon(value)

  return (
    <>
      <Input
        aria-label="Callout icon"
        value={value}
        maxLength={32}
        disabled={!editable}
        aria-invalid={!valid}
        onPointerDown={() => {
          editor.getEditorState().read(bookmark.capture)
        }}
        onFocus={() => {
          editor.getEditorState().read(bookmark.capture)
        }}
        onChange={(event) => {
          setValue(event.target.value)
        }}
      />
      <ToolbarButton
        render={<Button variant="ghost" size="sm" />}
        disabled={!editable || !valid || !hasSelection}
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onClick={() => {
          if (!editor.isEditable() || !valid) return
          editor.update(
            () => {
              if (bookmark.restore())
                editor.dispatchCommand(UPDATE_EDITOR_CALLOUT_COMMAND, {
                  icon: value,
                })
            },
            { tag: HISTORY_PUSH_TAG },
          )
          editor.focus()
        }}
      >
        Apply icon
      </ToolbarButton>
    </>
  )
}

export function EditorBlocksControls() {
  return (
    <>
      <EditorCalloutButton />
      <EditorToggleButton />
      <EditorRemoveBlockButton />
      <EditorBlockTypeButton kind="callout" />
      <EditorBlockTypeButton kind="toggle" />
      <EditorDisclosureButton />
      {editorCalloutAppearances.map((appearance) => (
        <EditorCalloutAppearanceButton
          key={appearance}
          appearance={appearance}
        />
      ))}
      <EditorCalloutIconControl />
      <EditorHistoryButton action="undo" />
      <EditorHistoryButton action="redo" />
    </>
  )
}

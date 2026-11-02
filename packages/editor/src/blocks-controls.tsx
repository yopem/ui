"use client"

import type { LexicalCommand } from "lexical"
import type { ChangeEvent, ComponentProps } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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

function preventButtonFocus(
  event: Parameters<
    NonNullable<ComponentProps<typeof ToolbarButton>["onMouseDown"]>
  >[0],
) {
  event.preventDefault()
}

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

    if (event.defaultPrevented || disabled || !editor.isEditable()) return
    let handled = false
    editor.update(
      () => {
        handled = editor.dispatchCommand(command, undefined)
      },
      { tag: HISTORY_PUSH_TAG },
    )

    if (handled) editor.focus()
  })

  return (
    <ToolbarButton
      {...props}
      render={props.render ?? <Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
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
  })

  return (
    <ToolbarButton
      {...props}
      render={props.render ?? <Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
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

    if (event.defaultPrevented || disabled || !editor.isEditable()) return
    let handled = false
    editor.update(
      () => {
        handled = editor.dispatchCommand(CONVERT_EDITOR_BLOCK_COMMAND, kind)
      },
      { tag: HISTORY_PUSH_TAG },
    )

    if (handled) editor.focus()
  })

  return (
    <ToolbarButton
      {...props}
      render={props.render ?? <Button variant="ghost" size="sm" />}
      disabled={disabled === true || !editable}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
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

  const captureSelection = useStableCallback(function captureSelection() {
    editor.getEditorState().read(bookmark.capture)
  })

  const changeValue = useStableCallback(function changeValue(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setValue(event.target.value)
  })

  const applyIcon = useStableCallback(function applyIcon() {
    if (!editor.isEditable() || !isEditorCalloutIcon(value)) return
    editor.update(
      () => {
        if (bookmark.restore())
          editor.dispatchCommand(UPDATE_EDITOR_CALLOUT_COMMAND, { icon: value })
      },
      { tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  })

  return (
    <>
      <Input
        aria-label="Callout icon"
        value={value}
        maxLength={32}
        disabled={!editable}
        aria-invalid={!valid}
        onPointerDown={captureSelection}
        onFocus={captureSelection}
        onChange={changeValue}
      />
      <ToolbarButton
        render={<Button variant="ghost" size="sm" />}
        disabled={!editable || !valid || !hasSelection}
        onMouseDown={preventButtonFocus}
        onClick={applyIcon}
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

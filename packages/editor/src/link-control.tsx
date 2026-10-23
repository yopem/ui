"use client"

import type { ComponentProps } from "react"

import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { useState, useSyncExternalStore } from "react"

import { isSafeLink } from "./extension"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

export type EditorLinkControlProps = ComponentProps<typeof ToolbarButton>

export function EditorLinkControl({
  children = "Link",
  disabled,
  onClick,
  onMouseDown,
  ...props
}: EditorLinkControlProps) {
  const { editable } = useEditorState()
  const editor = useEditor()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))

  const hasSelection = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [invalid, setInvalid] = useState(false)

  function applyLink(remove: boolean) {
    if (disabled || !editor.isEditable() || !bookmark.getSnapshot()) return

    if (!remove && !isSafeLink(url)) {
      setInvalid(true)

      return
    }

    editor.update(() => {
      if (!bookmark.restore()) return
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, remove ? null : url)
    })
    bookmark.clear()
    setOpen(false)
    setInvalid(false)
    editor.focus()
  }

  return (
    <Popover
      open={open && editable && !disabled}
      onOpenChange={(next) => {
        if (next) {
          editor.getEditorState().read(bookmark.capture)
          setInvalid(false)
        } else bookmark.clear()

        setOpen(next)
      }}
    >
      <PopoverTrigger
        disabled={!editable || disabled}
        render={
          <ToolbarButton
            render={<Button variant="ghost" size="sm" />}
            {...props}
            disabled={!editable || disabled}
          />
        }
        onClick={onClick}
        onMouseDown={(event) => {
          onMouseDown?.(event)
          event.preventDefault()
        }}
      >
        {children}
      </PopoverTrigger>
      <PopoverPopup>
        <Stack>
          <PopoverTitle>Link</PopoverTitle>
          <Input
            aria-label="Link URL"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              setInvalid(false)
            }}
            aria-invalid={invalid || undefined}
          />
          {invalid && (
            <Text role="alert">
              Use an absolute HTTP, HTTPS, mailto, or tel URL.
            </Text>
          )}
          {!hasSelection && (
            <Box render={<output />}>
              Selection changed. Close this popup. Select text again.
            </Box>
          )}
          <Button
            disabled={disabled === true || !editable || !hasSelection}
            onClick={() => applyLink(false)}
          >
            Apply link
          </Button>
          <Button
            disabled={disabled === true || !editable || !hasSelection}
            variant="ghost"
            onClick={() => applyLink(true)}
          >
            Remove link
          </Button>
        </Stack>
      </PopoverPopup>
    </Popover>
  )
}

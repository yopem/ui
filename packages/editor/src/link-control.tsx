"use client"

import type { ComponentProps } from "react"

import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Input } from "@registry/components/ui/input"
import { Label } from "@registry/components/ui/label"
import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { HISTORY_PUSH_TAG } from "lexical"
import { useState, useSyncExternalStore } from "react"

import {
  $getEditorLinkEditTarget,
  applyEditorLinkEdit,
  type EditorLinkEditTarget,
} from "./link-edit"
import { isSafeLink } from "./link-url"
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
  const [target, setTarget] = useState<EditorLinkEditTarget | null>(null)
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [newTab, setNewTab] = useState(false)
  const [invalid, setInvalid] = useState<"url" | "text" | false>(false)

  function applyLink(remove: boolean) {
    if (
      disabled ||
      !editor.isEditable() ||
      !hasSelection ||
      editor._updating ||
      editor._dirtyElements.size > 0 ||
      editor._dirtyLeaves.size > 0
    )
      return

    if (remove) {
      let removed = false

      editor.update(
        () => {
          if (!editor.isEditable() || !bookmark.restore()) return
          removed = editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
        },
        { discrete: true, tag: HISTORY_PUSH_TAG },
      )

      if (!removed) return
      bookmark.clear()
      setTarget(null)
      setOpen(false)
      setInvalid(false)
      editor.focus()

      return
    }

    if (!target) return

    if (!isSafeLink(url)) {
      setInvalid("url")

      return
    }

    if (!text.trim() || /[\r\n]/.test(text)) {
      setInvalid("text")

      return
    }

    const applied = applyEditorLinkEdit(editor, bookmark, target, {
      url,
      text,
      newTab,
    })

    if (!applied) return
    bookmark.clear()
    setTarget(null)
    setOpen(false)
    setInvalid(false)
    editor.focus()
  }

  const controlDisabled = disabled === true || !editable || !hasSelection

  return (
    <Popover
      open={open && editable && !disabled}
      onOpenChange={(next) => {
        if (next) {
          const currentTarget = editor.getEditorState().read(() => {
            bookmark.capture()

            return $getEditorLinkEditTarget()
          })

          setTarget(currentTarget)
          setUrl(currentTarget?.url ?? "")
          setText(currentTarget?.text ?? "")
          setNewTab(currentTarget?.newTab ?? false)
          setInvalid(false)
        } else {
          bookmark.clear()
          setTarget(null)
        }

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
            aria-invalid={invalid === "url" || undefined}
            disabled={controlDisabled}
          />
          <Input
            aria-label="Link text"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setInvalid(false)
            }}
            aria-invalid={invalid === "text" || undefined}
            disabled={controlDisabled}
          />
          <Label>
            <Checkbox
              aria-label="Open in new tab"
              checked={newTab}
              onCheckedChange={(checked) => setNewTab(checked === true)}
              disabled={controlDisabled}
            />
            Open in new tab
          </Label>
          {invalid === "url" && (
            <Text role="alert">
              Use an absolute HTTP, HTTPS, mailto, or tel URL.
            </Text>
          )}
          {invalid === "text" && <Text role="alert">Enter link text.</Text>}
          {!hasSelection && (
            <Box render={<output />}>
              Selection changed. Close this popup. Select text again.
            </Box>
          )}
          <Button disabled={controlDisabled} onClick={() => applyLink(false)}>
            Apply link
          </Button>
          <Button
            disabled={controlDisabled}
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

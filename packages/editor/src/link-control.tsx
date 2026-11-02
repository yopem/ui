"use client"

import type { ComponentProps } from "react"
import type { ChangeEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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
import { useRef, useState, useSyncExternalStore } from "react"

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
  const targetRef = useRef<EditorLinkEditTarget | null>(null)
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [newTab, setNewTab] = useState(false)
  const [invalid, setInvalid] = useState<"url" | "text" | false>(false)

  function applyLink(remove: boolean) {
    if (
      disabled ||
      !editor.isEditable() ||
      !bookmark.getSnapshot() ||
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
      targetRef.current = null
      setOpen(false)
      setInvalid(false)
      editor.focus()

      return
    }

    const target = targetRef.current

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
    targetRef.current = null
    setOpen(false)
    setInvalid(false)
    editor.focus()
  }

  const changeOpen = useStableCallback(function changeOpen(
    next: boolean,
    details: Parameters<
      NonNullable<ComponentProps<typeof Popover>["onOpenChange"]>
    >[1],
  ) {
    if (next) {
      if (details.event.defaultPrevented || disabled || !editor.isEditable()) {
        details.cancel()

        return
      }

      const currentTarget = editor.getEditorState().read(() => {
        bookmark.capture()

        return $getEditorLinkEditTarget()
      })

      targetRef.current = currentTarget
      const nextURL = currentTarget?.url ?? ""
      const nextText = currentTarget?.text ?? ""
      const nextTab = currentTarget?.newTab ?? false
      setUrl(nextURL)
      setText(nextText)
      setNewTab(nextTab)
      setInvalid(false)
    } else {
      bookmark.clear()
      targetRef.current = null
    }

    setOpen(next)
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<
      NonNullable<ComponentProps<typeof PopoverTrigger>["onClick"]>
    >[0],
  ) {
    onClick?.(event)

    if (event.defaultPrevented) event.preventBaseUIHandler()
  })

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<NonNullable<typeof onMouseDown>>[0],
  ) {
    onMouseDown?.(event)
    event.preventDefault()
  })

  const handleURLChange = useStableCallback(function handleURLChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setUrl(event.target.value)
    setInvalid(false)
  })

  const handleTextChange = useStableCallback(function handleTextChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setText(event.target.value)
    setInvalid(false)
  })

  const handleNewTabChange = useStableCallback(function handleNewTabChange(
    checked: Parameters<
      NonNullable<ComponentProps<typeof Checkbox>["onCheckedChange"]>
    >[0],
  ) {
    setNewTab(checked === true)
  })

  const applyCurrentLink = useStableCallback(function applyCurrentLink(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    if (!event.defaultPrevented) applyLink(false)
  })

  const removeCurrentLink = useStableCallback(function removeCurrentLink(
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    if (!event.defaultPrevented) applyLink(true)
  })

  const controlDisabled = disabled === true || !editable || !hasSelection

  return (
    <Popover open={open && editable && !disabled} onOpenChange={changeOpen}>
      <PopoverTrigger
        disabled={!editable || disabled}
        render={
          <ToolbarButton
            render={<Button variant="ghost" size="sm" />}
            {...props}
            disabled={!editable || disabled}
          />
        }
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {children}
      </PopoverTrigger>
      <PopoverPopup>
        <Stack>
          <PopoverTitle>Link</PopoverTitle>
          <Input
            aria-label="Link URL"
            value={url}
            onChange={handleURLChange}
            aria-invalid={invalid === "url" || undefined}
            disabled={controlDisabled}
          />
          <Input
            aria-label="Link text"
            value={text}
            onChange={handleTextChange}
            aria-invalid={invalid === "text" || undefined}
            disabled={controlDisabled}
          />
          <Label>
            <Checkbox
              aria-label="Open in new tab"
              checked={newTab}
              onCheckedChange={handleNewTabChange}
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
          <Button disabled={controlDisabled} onClick={applyCurrentLink}>
            Apply link
          </Button>
          <Button
            disabled={controlDisabled}
            variant="ghost"
            onClick={removeCurrentLink}
          >
            Remove link
          </Button>
        </Stack>
      </PopoverPopup>
    </Popover>
  )
}

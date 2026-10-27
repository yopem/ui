"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Calendar } from "@registry/components/ui/calendar"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { HISTORY_PUSH_TAG } from "lexical"
import {
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type MouseEvent,
} from "react"

import { INSERT_EDITOR_DATE_COMMAND } from "./date-extension"
import {
  editorDateFromCalendarDate,
  editorDateFromLocalDate,
  editorDateToCalendarDate,
  parseEditorDate,
  type EditorDateValue,
} from "./date-model"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

export interface EditorDateInsertControlProps {
  initialDate?: EditorDateValue
}

export function EditorDateInsertControl({
  initialDate,
}: EditorDateInsertControlProps) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )
  const [open, setOpen] = useState(false)

  const [date, setDate] = useState(() =>
    parseEditorDate(initialDate ?? editorDateFromLocalDate(new Date())),
  )

  const calendarDate = editorDateToCalendarDate(date)

  const capture = useStableCallback(function capture() {
    editor.getEditorState().read(bookmark.capture)
  })

  const changeOpen = useStableCallback(function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) capture()
    else bookmark.clear()
  })

  const insert = useStableCallback(function insert(value: EditorDateValue) {
    if (!editable || !editor.isEditable() || !bookmark.getSnapshot()) {
      setOpen(false)

      return
    }

    const revision = bookmark.getRevision()
    let inserted = false

    editor.update(
      () => {
        if (bookmark.getRevision() !== revision || !bookmark.restore()) return
        inserted = editor.dispatchCommand(INSERT_EDITOR_DATE_COMMAND, value)
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    bookmark.clear()
    setOpen(false)

    if (inserted) editor.focus()
  })

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    capture()
  })

  const handleFocus = useStableCallback(function handleFocus() {
    capture()
  })

  const handleBlur = useStableCallback(function handleBlur(
    event: FocusEvent<HTMLElement>,
  ) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    )
      return
    changeOpen(false)
  })

  const handleSelect = useStableCallback(function handleSelect(
    selected: Date | undefined,
  ) {
    if (!selected) return
    const next = editorDateFromCalendarDate(selected)
    setDate(next)
    insert(next)
  })

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="sm" />}
        disabled={!editable}
        onMouseDown={handleMouseDown}
        onFocus={handleFocus}
      >
        Insert date
      </PopoverTrigger>
      <PopoverPopup onBlur={handleBlur}>
        <Calendar
          defaultMonth={calendarDate}
          mode="single"
          onSelect={handleSelect}
          selected={calendarDate}
        />
      </PopoverPopup>
    </Popover>
  )
}

export function EditorDateControls(props: EditorDateInsertControlProps) {
  return <EditorDateInsertControl {...props} />
}

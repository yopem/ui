"use client"

import { Button } from "@registry/components/ui/button"
import { Calendar } from "@registry/components/ui/calendar"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { HISTORY_PUSH_TAG } from "lexical"
import { useState, useSyncExternalStore } from "react"

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

  function capture() {
    editor.getEditorState().read(bookmark.capture)
  }

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) capture()
    else bookmark.clear()
  }

  function insert(value: EditorDateValue) {
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
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" size="sm" />}
        disabled={!editable}
        onMouseDown={(event) => {
          event.preventDefault()
          capture()
        }}
        onFocus={capture}
      >
        Insert date
      </PopoverTrigger>
      <PopoverPopup
        onBlur={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          )
            return
          changeOpen(false)
        }}
      >
        <Calendar
          defaultMonth={calendarDate}
          mode="single"
          onSelect={(selected) => {
            if (!selected) return
            const next = editorDateFromCalendarDate(selected)
            setDate(next)
            insert(next)
          }}
          selected={calendarDate}
        />
      </PopoverPopup>
    </Popover>
  )
}

export function EditorDateControls(props: EditorDateInsertControlProps) {
  return <EditorDateInsertControl {...props} />
}

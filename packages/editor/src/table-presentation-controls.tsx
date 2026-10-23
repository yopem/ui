"use client"

import {
  $createTableNodeWithDimensions,
  $getTableNodeFromLexicalNodeOrThrow,
} from "@lexical/table"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"
import { Wrap } from "@registry/components/ui/wrap"
import {
  $insertNodes,
  $setState,
  HISTORY_PUSH_TAG,
  mergeRegister,
  type LexicalEditor,
} from "lexical"
import { useState, useSyncExternalStore } from "react"

import { useEditor, useEditorState } from "./root"
import { $getTableContext, createEditorTableBookmark } from "./table-bookmark"
import {
  $getSelectedTableCells,
  isTableBackground,
  tableCellBorderState,
  TABLE_MAX_CELLS,
  TABLE_MAX_COLUMNS,
  TABLE_MAX_ROWS,
} from "./table-presentation"

export function EditorTableDimensions() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [rows, setRows] = useState("3")
  const [columns, setColumns] = useState("3")
  const rowCount = Number(rows)
  const columnCount = Number(columns)

  const valid =
    Number.isInteger(rowCount) &&
    Number.isInteger(columnCount) &&
    rowCount >= 1 &&
    rowCount <= TABLE_MAX_ROWS &&
    columnCount >= 1 &&
    columnCount <= TABLE_MAX_COLUMNS &&
    rowCount * columnCount <= TABLE_MAX_CELLS

  return (
    <Wrap>
      <Field>
        <FieldLabel>Table rows</FieldLabel>
        <Input
          type="number"
          min={1}
          max={TABLE_MAX_ROWS}
          value={rows}
          disabled={!editable}
          onChange={(event) => setRows(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Table columns</FieldLabel>
        <Input
          type="number"
          min={1}
          max={TABLE_MAX_COLUMNS}
          value={columns}
          disabled={!editable}
          onChange={(event) => setColumns(event.target.value)}
        />
      </Field>
      <Button
        disabled={!editable || !valid}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (!valid || !editor.isEditable()) return
          editor.update(
            () => {
              if (!editor.isEditable()) return

              const table = $createTableNodeWithDimensions(
                rowCount,
                columnCount,
                true,
              )

              const cell = $getSelectedTableCells()[0]

              if (cell)
                $getTableNodeFromLexicalNodeOrThrow(cell).insertAfter(table)
              else $insertNodes([table])
              table.selectStart()
            },
            { tag: HISTORY_PUSH_TAG },
          )
          editor.focus()
        }}
      >
        Insert table
      </Button>
    </Wrap>
  )
}

function createCellPresentationState(editor: LexicalEditor) {
  const bookmark = createEditorTableBookmark(editor)

  function getSnapshot() {
    if (!editor.isEditable()) return false

    if (bookmark.getSnapshot()) return true
    const root = editor.getRootElement()

    return (
      root?.contains(root.ownerDocument.activeElement) === true &&
      editor.getEditorState().read(() => $getTableContext() !== null)
    )
  }

  function subscribe(notify: () => void) {
    function attach(root: HTMLElement | null, previous: HTMLElement | null) {
      previous?.removeEventListener("focusin", notify)
      previous?.removeEventListener("focusout", notify)
      root?.addEventListener("focusin", notify)
      root?.addEventListener("focusout", notify)
    }

    return mergeRegister(
      bookmark.subscribe(notify),
      editor.registerUpdateListener(notify),
      editor.registerEditableListener(notify),
      editor.registerRootListener(attach),
      () => attach(null, editor.getRootElement()),
    )
  }

  return {
    bookmark,
    subscribe,
    getSnapshot,
    getServerSnapshot: bookmark.getServerSnapshot,
  }
}

export function EditorTableCellPresentation() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [selection] = useState(() => createCellPresentationState(editor))
  const { bookmark } = selection

  const available = useSyncExternalStore(
    selection.subscribe,
    selection.getSnapshot,
    selection.getServerSnapshot,
  )

  const [background, setBackground] = useState("#ffffff")
  const unavailable = !editable || !available

  function save() {
    editor.getEditorState().read(bookmark.capture)
  }

  function apply(
    action: (cell: ReturnType<typeof $getSelectedTableCells>[number]) => void,
  ) {
    if (!editor.isEditable() || !bookmark.getSnapshot()) return
    let tableKey: string | undefined
    editor.update(
      () => {
        if (!editor.isEditable() || !bookmark.restore()) return
        const context = $getTableContext()

        if (!context) return
        tableKey = context.table.getKey()

        for (const cell of context.cells) action(cell)
      },
      {
        tag: HISTORY_PUSH_TAG,
        onUpdate() {
          editor.getEditorState().read(() => {
            if (tableKey && $getTableContext()?.table.getKey() === tableKey)
              bookmark.capture()
          })
        },
      },
    )
  }

  return (
    <Wrap
      onPointerDownCapture={save}
      onFocusCapture={() => {
        if (!bookmark.getSnapshot()) save()
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) bookmark.clear()
      }}
    >
      <Field>
        <FieldLabel>Cell background</FieldLabel>
        <Input
          value={background}
          disabled={!editable}
          onChange={(event) => setBackground(event.target.value)}
        />
      </Field>
      <Button
        disabled={unavailable || !isTableBackground(background)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => apply((cell) => cell.setBackgroundColor(background))}
      >
        Apply cell background
      </Button>
      <Button
        disabled={unavailable}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => apply((cell) => cell.setBackgroundColor(null))}
      >
        Reset cell background
      </Button>
      <Button
        disabled={unavailable}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          apply((cell) => $setState(cell, tableCellBorderState, "solid"))
        }
      >
        Show cell borders
      </Button>
      <Button
        disabled={unavailable}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          apply((cell) => $setState(cell, tableCellBorderState, "hidden"))
        }
      >
        Hide cell borders
      </Button>
      <Button
        disabled={unavailable}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          apply((cell) => $setState(cell, tableCellBorderState, null))
        }
      >
        Reset cell borders
      </Button>
    </Wrap>
  )
}

"use client"

import {
  $createTableNodeWithDimensions,
  $getTableNodeFromLexicalNodeOrThrow,
} from "@lexical/table"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Fieldset } from "@registry/components/ui/fieldset"
import { Input } from "@registry/components/ui/input"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Wrap } from "@registry/components/ui/wrap"
import {
  $insertNodes,
  HISTORY_PUSH_TAG,
  mergeRegister,
  type LexicalEditor,
} from "lexical"
import { useId, useState, useSyncExternalStore } from "react"

import { useEditor, useEditorState } from "./root"
import { $getTableContext, createEditorTableBookmark } from "./table-bookmark"
import {
  $getSelectedTableCells,
  isTableBackground,
  $setTableBorders,
  type TableBorderOperation,
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

const cellPresentationStates = new WeakMap<
  LexicalEditor,
  ReturnType<typeof createCellPresentationState>
>()

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

function useTablePresentation() {
  const editor = useEditor()
  const { editable } = useEditorState()

  const [selection] = useState(() => {
    const existing = cellPresentationStates.get(editor)

    if (existing) return existing
    const state = createCellPresentationState(editor)
    cellPresentationStates.set(editor, state)

    return state
  })

  const { bookmark } = selection

  const available = useSyncExternalStore(
    selection.subscribe,
    selection.getSnapshot,
    selection.getServerSnapshot,
  )

  const unavailable = !editable || !available

  function save() {
    editor.getEditorState().read(bookmark.capture)
  }

  function apply(
    action: (context: NonNullable<ReturnType<typeof $getTableContext>>) => void,
  ) {
    if (!editor.isEditable() || !bookmark.getSnapshot()) return
    let tableKey: string | undefined
    editor.update(
      () => {
        if (!editor.isEditable() || !bookmark.restore()) return
        const context = $getTableContext()

        if (!context) return
        tableKey = context.table.getKey()

        action(context)
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

  return { unavailable, editable, save, bookmark, apply }
}

export function EditorTableCellPresentation() {
  return (
    <Wrap>
      <EditorTableBackgroundControls />
      <EditorTableBorderControls />
    </Wrap>
  )
}

export function EditorTableBackgroundControls() {
  const { unavailable, editable, save, bookmark, apply } =
    useTablePresentation()

  const [background, setBackground] = useState("#ffffff")

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
        onClick={() =>
          apply(({ cells }) => {
            for (const cell of cells) cell.setBackgroundColor(background)
          })
        }
      >
        Apply cell background
      </Button>
      <Button
        disabled={unavailable}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          apply(({ cells }) => {
            for (const cell of cells) cell.setBackgroundColor(null)
          })
        }
      >
        Reset cell background
      </Button>
    </Wrap>
  )
}

export function EditorTableBorderControls() {
  const { unavailable, save, bookmark, apply } = useTablePresentation()
  const borderStyleId = useId()
  const [border, setBorder] = useState<"solid" | "hidden" | null>("solid")

  function applyBorder(
    operation: TableBorderOperation,
    value: "solid" | "hidden" | null = "solid",
  ) {
    apply(({ table, cells }) =>
      $setTableBorders(table, cells, operation, value),
    )
  }

  return (
    <Fieldset
      aria-label="Cell borders"
      onPointerDownCapture={save}
      onFocusCapture={() => {
        if (!bookmark.getSnapshot()) save()
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) bookmark.clear()
      }}
    >
      <Field>
        <FieldLabel htmlFor={borderStyleId}>Border edge style</FieldLabel>
        <NativeSelect
          id={borderStyleId}
          value={border ?? "reset"}
          disabled={unavailable}
          onChange={(event) => {
            const value = event.currentTarget.value

            if (value === "solid" || value === "hidden") setBorder(value)
            else setBorder(null)
          }}
        >
          <option value="solid">Solid</option>
          <option value="hidden">Hidden</option>
          <option value="reset">Default</option>
        </NativeSelect>
      </Field>
      <Wrap>
        {(
          [
            ["top", "Top cell border"],
            ["bottom", "Bottom cell border"],
            ["start", "Start cell border"],
            ["end", "End cell border"],
            ["outside", "Outside cell borders"],
            ["inside", "Inside cell borders"],
            ["none", "No cell borders"],
          ] as const
        ).map(([operation, label]) => (
          <Button
            key={operation}
            disabled={unavailable}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyBorder(operation, border)}
          >
            {label}
          </Button>
        ))}
        <Button
          disabled={unavailable}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyBorder("all")}
        >
          Show cell borders
        </Button>
        <Button
          disabled={unavailable}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyBorder("none")}
        >
          Hide cell borders
        </Button>
        <Button
          disabled={unavailable}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyBorder("reset")}
        >
          Reset cell borders
        </Button>
      </Wrap>
    </Fieldset>
  )
}

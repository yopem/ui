"use client"

import type { MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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
import {
  useId,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react"

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

function preventToolbarMouseDown(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

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

  const handleRowsChange = useStableCallback(function handleRowsChange(
    event: Parameters<NonNullable<ComponentProps<typeof Input>["onChange"]>>[0],
  ) {
    setRows(event.target.value)
  })

  const handleColumnsChange = useStableCallback(function handleColumnsChange(
    event: Parameters<NonNullable<ComponentProps<typeof Input>["onChange"]>>[0],
  ) {
    setColumns(event.target.value)
  })

  const handleInsertTable = useStableCallback(function handleInsertTable() {
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

        if (cell) $getTableNodeFromLexicalNodeOrThrow(cell).insertAfter(table)
        else $insertNodes([table])
        table.selectStart()
      },
      { tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  })

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
          onChange={handleRowsChange}
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
          onChange={handleColumnsChange}
        />
      </Field>
      <Button
        disabled={!editable || !valid}
        onMouseDown={preventToolbarMouseDown}
        onClick={handleInsertTable}
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

  const save = useStableCallback(function save() {
    editor.getEditorState().read(bookmark.capture)
  })

  const apply = useStableCallback(function apply(
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
  })

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

  const handleFocusCapture = useStableCallback(function handleFocusCapture() {
    if (!bookmark.getSnapshot()) save()
  })

  const handleBlurCapture = useStableCallback(function handleBlurCapture(
    event: Parameters<
      NonNullable<ComponentProps<typeof Wrap>["onBlurCapture"]>
    >[0],
  ) {
    if (!event.currentTarget.contains(event.relatedTarget)) bookmark.clear()
  })

  const handleBackgroundChange = useStableCallback(
    function handleBackgroundChange(
      event: Parameters<
        NonNullable<ComponentProps<typeof Input>["onChange"]>
      >[0],
    ) {
      setBackground(event.target.value)
    },
  )

  const handleApplyBackground = useStableCallback(
    function handleApplyBackground() {
      apply(({ cells }) => {
        for (const cell of cells) cell.setBackgroundColor(background)
      })
    },
  )

  const handleResetBackground = useStableCallback(
    function handleResetBackground() {
      apply(({ cells }) => {
        for (const cell of cells) cell.setBackgroundColor(null)
      })
    },
  )

  return (
    <Wrap
      onPointerDownCapture={save}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <Field>
        <FieldLabel>Cell background</FieldLabel>
        <Input
          value={background}
          disabled={!editable}
          onChange={handleBackgroundChange}
        />
      </Field>
      <Button
        disabled={unavailable || !isTableBackground(background)}
        onMouseDown={preventToolbarMouseDown}
        onClick={handleApplyBackground}
      >
        Apply cell background
      </Button>
      <Button
        disabled={unavailable}
        onMouseDown={preventToolbarMouseDown}
        onClick={handleResetBackground}
      >
        Reset cell background
      </Button>
    </Wrap>
  )
}

function TableBorderAction({
  operation,
  label,
  unavailable,
  value,
  applyBorder,
}: {
  operation: TableBorderOperation
  label: string
  unavailable: boolean
  value?: "solid" | "hidden" | null
  applyBorder: (
    operation: TableBorderOperation,
    value?: "solid" | "hidden" | null,
  ) => void
}) {
  const handleClick = useStableCallback(function handleClick() {
    applyBorder(operation, value)
  })

  return (
    <Button
      disabled={unavailable}
      onMouseDown={preventToolbarMouseDown}
      onClick={handleClick}
    >
      {label}
    </Button>
  )
}

export function EditorTableBorderControls() {
  const { unavailable, save, bookmark, apply } = useTablePresentation()
  const borderStyleId = useId()
  const [border, setBorder] = useState<"solid" | "hidden" | null>("solid")

  const applyBorder = useStableCallback(function applyBorder(
    operation: TableBorderOperation,
    value: "solid" | "hidden" | null = "solid",
  ) {
    apply(({ table, cells }) =>
      $setTableBorders(table, cells, operation, value),
    )
  })

  const handleFocusCapture = useStableCallback(function handleFocusCapture() {
    if (!bookmark.getSnapshot()) save()
  })

  const handleBlurCapture = useStableCallback(function handleBlurCapture(
    event: Parameters<
      NonNullable<ComponentProps<typeof Fieldset>["onBlurCapture"]>
    >[0],
  ) {
    if (!event.currentTarget.contains(event.relatedTarget)) bookmark.clear()
  })

  const handleBorderChange = useStableCallback(function handleBorderChange(
    event: Parameters<
      NonNullable<ComponentProps<typeof NativeSelect>["onChange"]>
    >[0],
  ) {
    const value = event.currentTarget.value

    if (value === "solid" || value === "hidden") setBorder(value)
    else setBorder(null)
  })

  return (
    <Fieldset
      aria-label="Cell borders"
      onPointerDownCapture={save}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <Field>
        <FieldLabel htmlFor={borderStyleId}>Border edge style</FieldLabel>
        <NativeSelect
          id={borderStyleId}
          value={border ?? "reset"}
          disabled={unavailable}
          onChange={handleBorderChange}
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
          <TableBorderAction
            key={operation}
            operation={operation}
            label={label}
            unavailable={unavailable}
            value={border}
            applyBorder={applyBorder}
          />
        ))}
        <TableBorderAction
          operation="all"
          label="Show cell borders"
          unavailable={unavailable}
          applyBorder={applyBorder}
        />
        <TableBorderAction
          operation="none"
          label="Hide cell borders"
          unavailable={unavailable}
          applyBorder={applyBorder}
        />
        <TableBorderAction
          operation="reset"
          label="Reset cell borders"
          unavailable={unavailable}
          applyBorder={applyBorder}
        />
      </Wrap>
    </Fieldset>
  )
}

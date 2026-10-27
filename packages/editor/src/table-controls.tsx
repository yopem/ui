"use client"

import type { ComponentProps } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $setTableRowIsHeader,
  TableCellHeaderStates,
} from "@lexical/table"
import { Button } from "@registry/components/ui/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@registry/components/ui/menu"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { HISTORY_PUSH_TAG } from "lexical"
import { useRef, useState, useSyncExternalStore } from "react"

import { $getTableContext, createEditorTableBookmark } from "./table-bookmark"
import {
  $mergeTableCellsWithBorders,
  $unmergeTableCellWithBorders,
  isTableMergeDisabled,
} from "./table-presentation"

export type EditorTableMenuProps = ComponentProps<typeof ToolbarButton>

export function EditorTableMenu({
  children = "Table actions",
  disabled,
  onMouseDown,
  onClick,
  "aria-label": label = "Table actions",
  ...props
}: EditorTableMenuProps) {
  const [editor] = useLexicalComposerContext()
  const [bookmark] = useState(() => createEditorTableBookmark(editor))

  const available = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const returnToEditor = useRef(false)
  const [open, setOpen] = useState(false)

  const [capabilities, setCapabilities] = useState({
    table: false,
    merge: false,
    split: false,
  })

  const subscribeEditable = useStableCallback(function subscribeEditable(
    notify: () => void,
  ) {
    return editor.registerEditableListener(notify)
  })

  const editable = useSyncExternalStore(
    subscribeEditable,
    () => editor.isEditable(),
    () => false,
  )

  function saveSelection() {
    editor.getEditorState().read(() => {
      bookmark.capture()
      const context = $getTableContext()
      setCapabilities({
        table: context !== null,
        merge:
          !isTableMergeDisabled(editor) &&
          context !== null &&
          context.cells.length > 1,
        split:
          context !== null &&
          (context.cell.getColSpan() > 1 || context.cell.getRowSpan() > 1),
      })
    })
  }

  function applyAction(
    action: (context: NonNullable<ReturnType<typeof $getTableContext>>) => void,
  ) {
    if (disabled || !editor.isEditable() || !bookmark.getSnapshot()) return
    editor.update(
      () => {
        if (!bookmark.restore()) return
        const context = $getTableContext()

        if (context) action(context)
      },
      { tag: HISTORY_PUSH_TAG },
    )
    bookmark.clear()
    returnToEditor.current = true
    setOpen(false)
  }

  const handleOpenChange = useStableCallback(function handleOpenChange(
    next: boolean,
  ) {
    if (next) {
      returnToEditor.current = false
      saveSelection()
    } else bookmark.clear()

    setOpen(next)
  })

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<NonNullable<EditorTableMenuProps["onMouseDown"]>>[0],
  ) {
    onMouseDown?.(event)

    if (!event.defaultPrevented) {
      saveSelection()
      event.preventDefault()
    }
  })

  const handleFinalFocus = useStableCallback(function handleFinalFocus() {
    if (!returnToEditor.current) return true
    returnToEditor.current = false
    editor.focus()

    return false
  })

  const handleInsertRowAbove = useStableCallback(
    function handleInsertRowAbove() {
      applyAction(() => {
        $insertTableRowAtSelection(false)
      })
    },
  )

  const handleInsertRowBelow = useStableCallback(
    function handleInsertRowBelow() {
      applyAction(() => {
        $insertTableRowAtSelection(true)
      })
    },
  )

  const handleInsertColumnBefore = useStableCallback(
    function handleInsertColumnBefore() {
      applyAction(() => {
        $insertTableColumnAtSelection(false)
      })
    },
  )

  const handleInsertColumnAfter = useStableCallback(
    function handleInsertColumnAfter() {
      applyAction(() => {
        $insertTableColumnAtSelection(true)
      })
    },
  )

  const handleToggleHeaderRow = useStableCallback(
    function handleToggleHeaderRow() {
      applyAction(({ cell, table }) => {
        $setTableRowIsHeader(
          table,
          $getTableRowIndexFromTableCellNode(cell),
          !cell.hasHeaderState(TableCellHeaderStates.ROW),
        )
      })
    },
  )

  const handleToggleHeaderCell = useStableCallback(
    function handleToggleHeaderCell() {
      applyAction(({ cell }) => {
        cell.setHeaderStyles(
          cell.getHeaderStyles() === TableCellHeaderStates.NO_STATUS
            ? TableCellHeaderStates.ROW
            : TableCellHeaderStates.NO_STATUS,
        )
      })
    },
  )

  const handleMergeCells = useStableCallback(function handleMergeCells() {
    applyAction(({ cells, table }) => {
      if (cells.length > 1)
        $mergeTableCellsWithBorders(table, cells)?.selectEnd()
    })
  })

  const handleSplitCell = useStableCallback(function handleSplitCell() {
    applyAction(() => {
      $unmergeTableCellWithBorders()
    })
  })

  const handleDeleteRow = useStableCallback(function handleDeleteRow() {
    applyAction(() => {
      $deleteTableRowAtSelection()
    })
  })

  const handleDeleteColumn = useStableCallback(function handleDeleteColumn() {
    applyAction(() => {
      $deleteTableColumnAtSelection()
    })
  })

  const handleDeleteTable = useStableCallback(function handleDeleteTable() {
    applyAction(({ table }) => {
      table.selectPrevious()
      table.remove()
    })
  })

  const unavailable =
    disabled === true || !editable || !available || !capabilities.table

  return (
    <Menu open={open && editable && !disabled} onOpenChange={handleOpenChange}>
      <MenuTrigger
        aria-label={label}
        disabled={disabled === true || !editable}
        render={
          <ToolbarButton
            render={<Button variant="ghost" size="sm" />}
            {...props}
          />
        }
        onClick={onClick}
        onMouseDown={handleMouseDown}
      >
        {children}
      </MenuTrigger>
      <MenuPopup
        aria-label={label}
        finalFocus={handleFinalFocus}
        portalProps={{ role: "region", "aria-label": label }}
      >
        <MenuItem disabled={unavailable} onClick={handleInsertRowAbove}>
          Insert row above
        </MenuItem>
        <MenuItem disabled={unavailable} onClick={handleInsertRowBelow}>
          Insert row below
        </MenuItem>
        <MenuItem disabled={unavailable} onClick={handleInsertColumnBefore}>
          Insert column before
        </MenuItem>
        <MenuItem disabled={unavailable} onClick={handleInsertColumnAfter}>
          Insert column after
        </MenuItem>
        <MenuSeparator />
        <MenuItem disabled={unavailable} onClick={handleToggleHeaderRow}>
          Toggle header row
        </MenuItem>
        <MenuItem disabled={unavailable} onClick={handleToggleHeaderCell}>
          Toggle header cell
        </MenuItem>
        <MenuItem
          disabled={unavailable || !capabilities.merge}
          onClick={handleMergeCells}
        >
          Merge selected cells
        </MenuItem>
        <MenuItem
          disabled={unavailable || !capabilities.split}
          onClick={handleSplitCell}
        >
          Split merged cell
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          variant="destructive"
          disabled={unavailable}
          onClick={handleDeleteRow}
        >
          Delete row
        </MenuItem>
        <MenuItem
          variant="destructive"
          disabled={unavailable}
          onClick={handleDeleteColumn}
        >
          Delete column
        </MenuItem>
        <MenuItem
          variant="destructive"
          disabled={unavailable}
          onClick={handleDeleteTable}
        >
          Delete table
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

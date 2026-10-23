"use client"

import type { ComponentProps } from "react"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $mergeCells,
  $setTableRowIsHeader,
  $unmergeCell,
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

  function subscribeEditable(notify: () => void) {
    return editor.registerEditableListener(notify)
  }

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
        merge: context !== null && context.cells.length > 1,
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

  const unavailable =
    disabled === true || !editable || !available || !capabilities.table

  return (
    <Menu
      open={open && editable && !disabled}
      onOpenChange={(next) => {
        if (next) {
          returnToEditor.current = false
          saveSelection()
        } else bookmark.clear()

        setOpen(next)
      }}
    >
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
        onMouseDown={(event) => {
          onMouseDown?.(event)

          if (!event.defaultPrevented) {
            saveSelection()
            event.preventDefault()
          }
        }}
      >
        {children}
      </MenuTrigger>
      <MenuPopup
        aria-label={label}
        portalProps={{ role: "region", "aria-label": label }}
        finalFocus={() => {
          if (!returnToEditor.current) return true
          returnToEditor.current = false
          editor.focus()

          return false
        }}
      >
        <MenuItem
          disabled={unavailable}
          onClick={() =>
            applyAction(() => {
              $insertTableRowAtSelection(false)
            })
          }
        >
          Insert row above
        </MenuItem>
        <MenuItem
          disabled={unavailable}
          onClick={() =>
            applyAction(() => {
              $insertTableRowAtSelection(true)
            })
          }
        >
          Insert row below
        </MenuItem>
        <MenuItem
          disabled={unavailable}
          onClick={() =>
            applyAction(() => {
              $insertTableColumnAtSelection(false)
            })
          }
        >
          Insert column before
        </MenuItem>
        <MenuItem
          disabled={unavailable}
          onClick={() =>
            applyAction(() => {
              $insertTableColumnAtSelection(true)
            })
          }
        >
          Insert column after
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          disabled={unavailable}
          onClick={() =>
            applyAction(({ cell, table }) => {
              $setTableRowIsHeader(
                table,
                $getTableRowIndexFromTableCellNode(cell),
                !cell.hasHeaderState(TableCellHeaderStates.ROW),
              )
            })
          }
        >
          Toggle header row
        </MenuItem>
        <MenuItem
          disabled={unavailable}
          onClick={() =>
            applyAction(({ cell }) => {
              cell.setHeaderStyles(
                cell.getHeaderStyles() === TableCellHeaderStates.NO_STATUS
                  ? TableCellHeaderStates.ROW
                  : TableCellHeaderStates.NO_STATUS,
              )
            })
          }
        >
          Toggle header cell
        </MenuItem>
        <MenuItem
          disabled={unavailable || !capabilities.merge}
          onClick={() =>
            applyAction(({ cells }) => {
              if (cells.length > 1) $mergeCells(cells)?.selectEnd()
            })
          }
        >
          Merge selected cells
        </MenuItem>
        <MenuItem
          disabled={unavailable || !capabilities.split}
          onClick={() =>
            applyAction(() => {
              $unmergeCell()
            })
          }
        >
          Split merged cell
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          variant="destructive"
          disabled={unavailable}
          onClick={() =>
            applyAction(() => {
              $deleteTableRowAtSelection()
            })
          }
        >
          Delete row
        </MenuItem>
        <MenuItem
          variant="destructive"
          disabled={unavailable}
          onClick={() =>
            applyAction(() => {
              $deleteTableColumnAtSelection()
            })
          }
        >
          Delete column
        </MenuItem>
        <MenuItem
          variant="destructive"
          disabled={unavailable}
          onClick={() =>
            applyAction(({ table }) => {
              table.selectPrevious()
              table.remove()
            })
          }
        >
          Delete table
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

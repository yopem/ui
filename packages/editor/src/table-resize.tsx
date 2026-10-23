"use client"

import type { TableNode } from "@lexical/table"
import type { LexicalEditor, NodeKey } from "lexical"

import {
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
} from "@lexical/table"
import { Fieldset } from "@registry/components/ui/fieldset"
import { Separator } from "@registry/components/ui/separator"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
  mergeRegister,
  setDOMUnmanaged,
} from "lexical"
import { GripHorizontal, GripVertical } from "lucide-react"
import { useState, useSyncExternalStore } from "react"

import { useEditor, useEditorState } from "./root"
import {
  $getSelectedTableCells,
  clampTableColumnWidth,
  TABLE_MAX_COLUMN_WIDTH,
  TABLE_MIN_COLUMN_WIDTH,
} from "./table-presentation"

const ariaNumbers = new Intl.NumberFormat("en-US", {
  notation: "standard",
  useGrouping: false,
  maximumSignificantDigits: 21,
})

function $columnWidths(editor: LexicalEditor, table: TableNode) {
  const root = editor.getElementByKey(table.getKey())
  const dom = root?.matches("table") ? root : root?.querySelector("table")
  const count = table.getColumnCount()

  const measured =
    dom && count ? dom.getBoundingClientRect().width / count : 120

  const measuredColumns: number[] = []

  for (const cell of dom?.querySelector("tr")?.querySelectorAll("th, td") ??
    []) {
    const span = Number(cell.getAttribute("colspan") ?? 1)
    const cellWidth = cell.getBoundingClientRect().width / span

    for (
      let column = 0;
      column < span && measuredColumns.length < count;
      column += 1
    )
      measuredColumns.push(cellWidth)
  }

  return Array.from({ length: count }, (_, index) =>
    clampTableColumnWidth(
      table.getColWidths()?.[index] ?? measuredColumns[index] ?? measured,
    ),
  )
}

interface ResizeColumn {
  key: string
  index: number
  width: number
}

interface ResizeSnapshot {
  tableKey: NodeKey
  columns: ResizeColumn[]
  rows: { key: string; index: number; width: number }[]
}

function createResizeStore(editor: LexicalEditor) {
  let key: NodeKey | null = null
  let snapshot: ResizeSnapshot | null = null

  function refresh() {
    editor.getEditorState().read(() => {
      const cell = $getSelectedTableCells()[0]

      if (cell) key = $getTableNodeFromLexicalNodeOrThrow(cell).getKey()
      else if ($getSelection()) key = null
      const table = key ? $getNodeByKey(key) : null

      if (!$isTableNode(table) || !table.isAttached()) {
        snapshot = null

        return
      }

      const row = table.getFirstChild()
      const widths = $columnWidths(editor, table)
      const columns: ResizeColumn[] = []

      if ($isTableRowNode(row)) {
        for (const child of row.getChildren()) {
          if (!$isTableCellNode(child)) continue

          for (let offset = 0; offset < child.getColSpan(); offset += 1) {
            const index = columns.length
            const width = widths[index]

            if (width !== undefined)
              columns.push({
                key: `${child.getKey()}-${offset}-${index}`,
                index,
                width,
              })
          }
        }
      }

      const rows = table
        .getChildren()
        .filter($isTableRowNode)
        .map((row, index) => ({
          key: row.getKey(),
          index,
          width: row.getHeight() ?? 0,
        }))

      const previous = snapshot

      if (
        previous?.tableKey === table.getKey() &&
        previous.columns.length === columns.length &&
        previous.rows.length === rows.length &&
        rows.every(
          (row, index) =>
            row.key === previous.rows[index]?.key &&
            row.width === previous.rows[index]?.width,
        ) &&
        columns.every(
          (column, index) =>
            column.key === previous.columns[index]?.key &&
            column.width === previous.columns[index]?.width,
        )
      )
        return
      snapshot = { tableKey: table.getKey(), columns, rows }
    })
  }

  return {
    subscribe(this: void, notify: () => void) {
      let observer: ResizeObserver | undefined

      function update() {
        refresh()
        notify()
      }

      update()

      return mergeRegister(
        editor.registerUpdateListener(update),
        editor.registerRootListener((root) => {
          observer?.disconnect()
          const Observer = root?.ownerDocument.defaultView?.ResizeObserver

          if (root && Observer) {
            let inlineSize = root.getBoundingClientRect().width
            observer = new Observer(() => {
              const nextSize = root.getBoundingClientRect().width

              if (nextSize !== inlineSize) {
                inlineSize = nextSize
                update()
              }
            })
            observer.observe(root)
          }
        }),
        () => observer?.disconnect(),
      )
    },
    getSnapshot(this: void) {
      return snapshot
    },
  }
}

function setWidth(
  editor: LexicalEditor,
  key: NodeKey,
  index: number,
  width: number,
  rowKey?: NodeKey,
) {
  if (!editor.isEditable()) return
  editor.update(
    () => {
      if (!editor.isEditable() || $getRoot().isDirty()) return
      const table = $getNodeByKey(key)

      if (
        !$isTableNode(table) ||
        !table.isAttached() ||
        (!rowKey && index >= table.getColumnCount())
      )
        return

      if (rowKey) {
        const row = $getNodeByKey(rowKey)

        if (
          $isTableRowNode(row) &&
          row.getParent()?.is(table) &&
          Number.isFinite(width)
        )
          row.setHeight(Math.max(0, width))

        return
      }

      const widths = $columnWidths(editor, table)

      widths[index] = clampTableColumnWidth(width)
      table.setColWidths(widths)
    },
    { tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG] },
  )
}

function prepareResize(
  editor: LexicalEditor,
  tableKey: NodeKey,
  index: number,
  handle: HTMLElement,
  table: HTMLElement,
  rowKey?: NodeKey,
) {
  const document = handle.ownerDocument

  if (rowKey) {
    const row = editor.getElementByKey(rowKey)

    if (!row) return null

    const initial = editor.getEditorState().read(() => {
      const node = $getNodeByKey(rowKey)

      return $isTableRowNode(node) ? (node.getHeight() ?? 0) : 0
    })

    const original = row.style.height
    const measured = row.getBoundingClientRect().height

    return {
      initial,
      preview(delta: number) {
        const next = Math.max(0, Math.round(measured + delta))
        row.style.height = `${next}px`

        return next
      },
      restore(changed: boolean) {
        row.style.height = original

        if (changed)
          editor.getEditorState().read(() => {
            const current = $getNodeByKey(rowKey)

            if ($isTableRowNode(current))
              row.style.height =
                current.getHeight() === undefined
                  ? ""
                  : `${current.getHeight()}px`
          })
      },
    }
  }

  const widths = editor.getEditorState().read(() => {
    const node = $getNodeByKey(tableKey)

    return $isTableNode(node) ? $columnWidths(editor, node) : []
  })

  let group = table.querySelector("colgroup")
  const temporary = !group

  if (!group) {
    group = document.createElement("colgroup")
    setDOMUnmanaged(group)

    for (const value of widths) {
      const column = document.createElement("col")
      column.style.width = `${value}px`
      group.append(column)
    }

    table.prepend(group)
  }

  const col = group.querySelectorAll("col")[index]

  if (!col) {
    if (temporary) group.remove()

    return null
  }

  const column = col
  const tableElement = table
  const columnGroup = group
  const original = column.style.width
  const originalSize = table.style.inlineSize
  const originalLayout = table.style.tableLayout

  const cellStyles = Array.from(
    table.querySelectorAll<HTMLElement>("td, th"),
    (cell) => ({
      cell,
      minimum: cell.style.minInlineSize,
      wrap: cell.style.overflowWrap,
    }),
  )

  for (const { cell } of cellStyles) {
    cell.style.minInlineSize = "0"
    cell.style.overflowWrap = "anywhere"
  }

  table.style.tableLayout = "fixed"
  const total = widths.reduce((sum, value) => sum + value, 0)
  table.style.inlineSize = `${total}px`

  const direction =
    document.defaultView?.getComputedStyle(handle).direction === "rtl" ? -1 : 1

  const initial = widths[index] ?? TABLE_MIN_COLUMN_WIDTH

  return {
    initial,
    preview(delta: number) {
      const next = clampTableColumnWidth(initial + delta * direction)
      column.style.width = `${next}px`
      tableElement.style.inlineSize = `${total + next - initial}px`

      return next
    },
    restore(changed: boolean) {
      column.style.width = original
      tableElement.style.inlineSize = originalSize
      tableElement.style.tableLayout = originalLayout

      for (const { cell, minimum, wrap } of cellStyles) {
        cell.style.minInlineSize = minimum
        cell.style.overflowWrap = wrap
      }

      if (temporary) columnGroup.remove()

      if (changed)
        editor.getEditorState().read(() => {
          const node = $getNodeByKey(tableKey)

          if (!$isTableNode(node) || !node.isAttached()) return
          const current = node.getColWidths()

          for (const [position, element] of tableElement
            .querySelectorAll("col")
            .entries()) {
            const value = current?.[position]

            if (value !== undefined) element.style.width = `${value}px`
          }

          tableElement.style.inlineSize = current
            ? `${current.reduce((sum, value) => sum + value, 0)}px`
            : originalSize
          tableElement.style.tableLayout = current ? "fixed" : originalLayout
        })
    },
  }
}

function TableResizeSeparator({
  tableKey,
  index,
  width,
  rowKey,
}: {
  tableKey: NodeKey
  index: number
  width: number
  rowKey?: NodeKey
}) {
  const editor = useEditor()
  const { editable } = useEditorState()

  const [connect] = useState(function createPointerBinding() {
    return function attachSeparator(element: HTMLElement | null) {
      if (!element) return
      const handle = element
      let cancelDrag: (() => void) | undefined

      function syncRowAriaNumbers() {
        if (!rowKey) return
        editor.getEditorState().read(() => {
          const row = $getNodeByKey(rowKey)

          if (!$isTableRowNode(row)) return
          const value = row.getHeight() ?? 0
          handle.setAttribute("aria-valuenow", ariaNumbers.format(value))
          handle.setAttribute(
            "aria-valuemin",
            ariaNumbers.format(Math.min(0, value)),
          )
          handle.setAttribute(
            "aria-valuemax",
            ariaNumbers.format(Number.MAX_VALUE),
          )
        })
      }

      function start(event: PointerEvent) {
        if (!editor.isEditable() || event.button !== 0) return
        event.preventDefault()
        cancelDrag?.()
        const document = handle.ownerDocument
        const tableRoot = editor.getElementByKey(tableKey)

        const table = tableRoot?.matches("table")
          ? tableRoot
          : tableRoot?.querySelector("table")

        if (!table) return

        const prepared = prepareResize(
          editor,
          tableKey,
          index,
          handle,
          table,
          rowKey,
        )

        if (!prepared) return
        const preview = prepared
        const initial = preview.initial
        let contentChanged = false
        let next = initial
        let finished = false
        const controller = new AbortController()

        function finish(commit: boolean) {
          if (finished) return
          finished = true
          unregisterUpdate()
          controller.abort()

          if (handle.hasPointerCapture(event.pointerId))
            handle.releasePointerCapture(event.pointerId)
          preview.restore(contentChanged)
          cancelDrag = undefined

          if (contentChanged) return

          if (commit && editor.isEditable()) {
            if (next !== initial)
              setWidth(editor, tableKey, index, next, rowKey)

            if (handle.isConnected) handle.focus({ preventScroll: true })
          }
        }

        cancelDrag = () => finish(false)

        const unregisterUpdate = editor.registerUpdateListener(
          ({ dirtyElements, dirtyLeaves }) => {
            if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
              contentChanged = true
              finish(false)
            }
          },
        )

        const signal = controller.signal
        handle.setPointerCapture(event.pointerId)
        handle.addEventListener("lostpointercapture", () => finish(false), {
          signal,
        })
        document.addEventListener(
          "pointermove",
          (move) => {
            if (move.pointerId !== event.pointerId) return

            if (!editor.isEditable() || !table.isConnected) {
              finish(false)

              return
            }

            next = preview.preview(
              rowKey
                ? move.clientY - event.clientY
                : move.clientX - event.clientX,
            )
          },
          { signal },
        )
        document.addEventListener(
          "pointerup",
          (up) => {
            if (up.pointerId === event.pointerId) finish(true)
          },
          { signal },
        )
        document.addEventListener(
          "pointercancel",
          (cancel) => {
            if (cancel.pointerId === event.pointerId) finish(false)
          },
          { signal },
        )
        document.addEventListener(
          "focusin",
          (focus) => {
            if (focus.target !== handle) finish(false)
          },
          { signal },
        )
        document.addEventListener(
          "keydown",
          (key) => {
            if (key.key === "Escape") {
              key.preventDefault()
              finish(false)
            }
          },
          { signal },
        )
        document.defaultView?.addEventListener("blur", () => finish(false), {
          signal,
        })
      }

      syncRowAriaNumbers()

      const unregisterAria = rowKey
        ? editor.registerUpdateListener(syncRowAriaNumbers)
        : undefined

      element.addEventListener("pointerdown", start)

      return mergeRegister(
        editor.registerEditableListener((enabled) => {
          if (!enabled) cancelDrag?.()
        }),
        editor.registerRootListener(() => cancelDrag?.()),
        () => {
          unregisterAria?.()
          cancelDrag?.()
          element.removeEventListener("pointerdown", start)
        },
      )
    }
  })

  return (
    <Stack>
      <Text>{`${rowKey ? "Row minimum" : "Column"} ${index + 1}: ${width}px`}</Text>
      <Separator
        orientation={rowKey ? "horizontal" : "vertical"}
        aria-label={
          rowKey
            ? `Row ${index + 1} minimum height`
            : `Column ${index + 1} width`
        }
        aria-valuemin={rowKey ? undefined : TABLE_MIN_COLUMN_WIDTH}
        aria-valuemax={rowKey ? undefined : TABLE_MAX_COLUMN_WIDTH}
        aria-valuenow={rowKey ? undefined : width}
        aria-valuetext={
          rowKey
            ? `Stored minimum ${width} pixels; content can make the row taller`
            : `${width} pixels`
        }
        aria-disabled={!editable}
        tabIndex={0}
        xstyle={[styles.separator, rowKey !== undefined && styles.rowSeparator]}
        ref={connect}
        onKeyDown={(event) => {
          if (!editor.isEditable()) return

          const rtl =
            event.currentTarget.ownerDocument.defaultView?.getComputedStyle(
              event.currentTarget,
            ).direction === "rtl"

          let next = width

          switch (event.key) {
            case "Home":
              next = rowKey ? 0 : TABLE_MIN_COLUMN_WIDTH
              break
            case "End":
              if (rowKey) return
              next = TABLE_MAX_COLUMN_WIDTH
              break
            case "ArrowUp":
              if (!rowKey) return
              next -= 10
              break
            case "ArrowDown":
              if (!rowKey) return
              next += 10
              break
            case "ArrowLeft":
              if (rowKey) return
              next += rtl ? 10 : -10
              break
            case "ArrowRight":
              if (rowKey) return
              next += rtl ? -10 : 10
              break
            default:
              return
          }

          event.preventDefault()
          setWidth(editor, tableKey, index, next, rowKey)
        }}
      >
        {rowKey ? (
          <GripHorizontal aria-hidden="true" size={18} />
        ) : (
          <GripVertical aria-hidden="true" size={18} />
        )}
      </Separator>
    </Stack>
  )
}

export function EditorTableResizeControls() {
  const editor = useEditor()

  const [store] = useState(() => createResizeStore(editor))

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => null,
  )

  if (!snapshot) return null

  return (
    <Stack>
      <Fieldset aria-label="Table column widths">
        <Wrap>
          {snapshot.columns.map((column) => (
            <TableResizeSeparator
              key={column.key}
              tableKey={snapshot.tableKey}
              index={column.index}
              width={column.width}
            />
          ))}
        </Wrap>
      </Fieldset>
      <Fieldset aria-label="Table row minimum heights">
        <Wrap>
          {snapshot.rows.map((row) => (
            <TableResizeSeparator
              key={row.key}
              tableKey={snapshot.tableKey}
              rowKey={row.key}
              index={row.index}
              width={row.width}
            />
          ))}
        </Wrap>
      </Fieldset>
    </Stack>
  )
}

const styles = stylex.create({
  rowSeparator: { cursor: "row-resize" },
  separator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: 0,
    minBlockSize: "2.75rem",
    minInlineSize: "2.75rem",
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-md"],
    padding: `calc(${tokens["--spacing"]} * 3)`,
    cursor: "col-resize",
    touchAction: "none",
    userSelect: "none",
    color: tokens["--foreground"],
    backgroundColor: tokens["--background"],
    outlineColor: tokens["--ring"],
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineWidth: 2,
    outlineOffset: 2,
  },
})

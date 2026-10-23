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
import { GripVertical } from "lucide-react"
import { useState, useSyncExternalStore } from "react"

import { useEditor, useEditorState } from "./root"
import {
  $getSelectedTableCells,
  clampTableColumnWidth,
  TABLE_MAX_COLUMN_WIDTH,
  TABLE_MIN_COLUMN_WIDTH,
} from "./table-presentation"

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

      const previous = snapshot

      if (
        previous?.tableKey === table.getKey() &&
        previous.columns.length === columns.length &&
        columns.every(
          (column, index) =>
            column.key === previous.columns[index]?.key &&
            column.width === previous.columns[index]?.width,
        )
      )
        return
      snapshot = { tableKey: table.getKey(), columns }
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
) {
  if (!editor.isEditable()) return
  editor.update(
    () => {
      if (!editor.isEditable() || $getRoot().isDirty()) return
      const table = $getNodeByKey(key)

      if (
        !$isTableNode(table) ||
        !table.isAttached() ||
        index >= table.getColumnCount()
      )
        return

      const widths = $columnWidths(editor, table)

      widths[index] = clampTableColumnWidth(width)
      table.setColWidths(widths)
    },
    { tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG] },
  )
}

function ColumnResizeSeparator({
  tableKey,
  index,
  width,
}: {
  tableKey: NodeKey
  index: number
  width: number
}) {
  const editor = useEditor()
  const { editable } = useEditorState()

  const [connect] = useState(function createPointerBinding() {
    return function attachSeparator(element: HTMLElement | null) {
      if (!element) return
      const handle = element
      let cancelDrag: (() => void) | undefined

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

          return
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
          document.defaultView?.getComputedStyle(handle).direction === "rtl"
            ? -1
            : 1

        const initial = widths[index] ?? TABLE_MIN_COLUMN_WIDTH

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
          column.style.width = original
          tableElement.style.inlineSize = originalSize
          tableElement.style.tableLayout = originalLayout

          for (const { cell, minimum, wrap } of cellStyles) {
            cell.style.minInlineSize = minimum
            cell.style.overflowWrap = wrap
          }

          if (temporary) columnGroup.remove()
          cancelDrag = undefined

          if (contentChanged) {
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
              tableElement.style.tableLayout = current
                ? "fixed"
                : originalLayout
            })

            return
          }

          if (commit && editor.isEditable()) {
            if (next !== initial) setWidth(editor, tableKey, index, next)

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

            if (!editor.isEditable() || !col.isConnected) {
              finish(false)

              return
            }

            next = clampTableColumnWidth(
              initial + (move.clientX - event.clientX) * direction,
            )
            col.style.width = `${next}px`
            table.style.inlineSize = `${total + next - initial}px`
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

      element.addEventListener("pointerdown", start)

      return mergeRegister(
        editor.registerEditableListener((enabled) => {
          if (!enabled) cancelDrag?.()
        }),
        editor.registerRootListener(() => cancelDrag?.()),
        () => {
          cancelDrag?.()
          element.removeEventListener("pointerdown", start)
        },
      )
    }
  })

  return (
    <Stack>
      <Text>{`Column ${index + 1}: ${width}px`}</Text>
      <Separator
        orientation="vertical"
        aria-label={`Column ${index + 1} width`}
        aria-valuemin={TABLE_MIN_COLUMN_WIDTH}
        aria-valuemax={TABLE_MAX_COLUMN_WIDTH}
        aria-valuenow={width}
        aria-valuetext={`${width} pixels`}
        aria-disabled={!editable}
        tabIndex={0}
        xstyle={styles.separator}
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
              next = TABLE_MIN_COLUMN_WIDTH
              break
            case "End":
              next = TABLE_MAX_COLUMN_WIDTH
              break
            case "ArrowLeft":
              next += rtl ? 10 : -10
              break
            case "ArrowRight":
              next += rtl ? -10 : 10
              break
            default:
              return
          }

          event.preventDefault()
          setWidth(editor, tableKey, index, next)
        }}
      >
        <GripVertical aria-hidden="true" size={18} />
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
    <Fieldset aria-label="Table column widths">
      <Wrap>
        {snapshot.columns.map((column) => (
          <ColumnResizeSeparator
            key={column.key}
            tableKey={snapshot.tableKey}
            index={column.index}
            width={column.width}
          />
        ))}
      </Wrap>
    </Fieldset>
  )
}

const styles = stylex.create({
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

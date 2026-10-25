import type {
  DOMConversionMap,
  DOMExportOutput,
  Klass,
  LexicalEditor,
  LexicalNode,
  SerializedLexicalNode,
} from "lexical"

import {
  $createTableNodeWithDimensions,
  $mergeCells,
  $unmergeCell,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  TableCellNode,
  TableExtension,
  TableNode,
  TableRowNode,
} from "@lexical/table"
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $getState,
  $insertNodes,
  $isRangeSelection,
  $isElementNode,
  isHTMLElement,
  $getNodeByKey,
  $setState,
  COMMAND_PRIORITY_HIGH,
  createState,
  createCommand,
  RootNode,
  defineExtension,
  mergeRegister,
  PASTE_COMMAND,
} from "lexical"
import { z } from "zod"

import {
  tablePresentationDocumentSchema,
  validateTablePresentationHTML,
  TABLE_MIN_COLUMN_WIDTH,
  TABLE_MAX_COLUMN_WIDTH,
  TABLE_MAX_ROWS,
  TABLE_MAX_COLUMNS,
  TABLE_MAX_CELLS,
  TABLE_MAX_INPUT_BYTES,
  TABLE_MAX_NODES,
  TABLE_MAX_DEPTH,
  tableBorderSchema,
  readTableBorderHTML,
  parseTableRowHeightHTML,
  getTableSpanGeometry,
  getTableEdgeGroups,
  type TableBorder,
  type TableBorderEdge,
} from "./table-presentation-schema"

export {
  TABLE_MIN_COLUMN_WIDTH,
  TABLE_MAX_COLUMN_WIDTH,
  TABLE_MAX_ROWS,
  TABLE_MAX_COLUMNS,
  TABLE_MAX_CELLS,
} from "./table-presentation-schema"

export const TABLE_PRESENTATION_ERROR_COMMAND = createCommand<Error>(
  "TABLE_PRESENTATION_ERROR_COMMAND",
)

class TablePresentationError extends Error {}

export function clampTableColumnWidth(width: number) {
  return Math.round(
    Math.max(
      TABLE_MIN_COLUMN_WIDTH,
      Math.min(TABLE_MAX_COLUMN_WIDTH, Number.isFinite(width) ? width : 120),
    ),
  )
}

export function isTableBackground(value: string) {
  return /^#[\da-f]{6}$/i.test(value)
}

const borderSchema = tableBorderSchema.catch(null)

export const tableCellBorderState = createState("yopemTableBorder", {
  parse: (value) => borderSchema.parse(value),
})

export function $getSelectedTableCells() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection) && !$isTableSelection(selection)) return []

  if ($isTableSelection(selection) && !selection.isValid()) return []
  const anchor = $getTableCellNodeFromLexicalNode(selection.anchor.getNode())
  const focus = $getTableCellNodeFromLexicalNode(selection.focus.getNode())

  if (!anchor || !focus || !anchor.isAttached() || !focus.isAttached())
    return []

  if (
    !$getTableNodeFromLexicalNodeOrThrow(anchor).is(
      $getTableNodeFromLexicalNodeOrThrow(focus),
    )
  )
    return []

  if ($isRangeSelection(selection)) return anchor.is(focus) ? [anchor] : []

  return selection.getNodes().filter($isTableCellNode)
}

export function expandTableBorder(value: TableBorder) {
  return value !== null && value !== "solid" && value !== "hidden"
    ? value
    : { top: value, bottom: value, start: value, end: value }
}

export type TableBorderOperation =
  | TableBorderEdge
  | "inside"
  | "outside"
  | "all"
  | "none"
  | "reset"

function $tableCellGeometry(table: TableNode) {
  const rows = table
    .getChildren()
    .filter($isTableRowNode)
    .map((row) => row.getChildren().filter($isTableCellNode))

  const cells = rows.flat()

  const geometry = getTableSpanGeometry(
    rows.map((row) =>
      row.map((cell) => ({
        colSpan: cell.getColSpan(),
        rowSpan: cell.getRowSpan(),
      })),
    ),
  )

  return { cells, geometry }
}

export function $mergeTableCellsWithBorders(
  table: TableNode,
  selected: TableCellNode[],
) {
  const { cells, geometry } = $tableCellGeometry(table)

  const slots = geometry.placements.flatMap((slot, index) =>
    selected.some((cell) => cell.is(cells[index]))
      ? [{ ...slot, cell: cells[index] }]
      : [],
  )

  if (slots.length < 2) return null

  const bounds = {
    top: Math.min(...slots.map((slot) => slot.row)),
    bottom: Math.max(...slots.map((slot) => slot.row + slot.rowSpan)),
    start: Math.min(...slots.map((slot) => slot.column)),
    end: Math.max(...slots.map((slot) => slot.column + slot.colSpan)),
  }

  function edgeValue(edge: TableBorderEdge): "solid" | "hidden" | null {
    const values = slots
      .filter((slot) =>
        edge === "top"
          ? slot.row === bounds.top
          : edge === "bottom"
            ? slot.row + slot.rowSpan === bounds.bottom
            : edge === "start"
              ? slot.column === bounds.start
              : slot.column + slot.colSpan === bounds.end,
      )
      .map(
        (slot) =>
          expandTableBorder($getState(slot.cell, tableCellBorderState))[edge],
      )

    return values.includes("solid")
      ? "solid"
      : values.every((value) => value === "hidden")
        ? "hidden"
        : null
  }

  const border = {
    top: edgeValue("top"),
    bottom: edgeValue("bottom"),
    start: edgeValue("start"),
    end: edgeValue("end"),
  }

  const merged = $mergeCells(selected)

  if (!merged) return null

  for (const edge of ["top", "bottom", "start", "end"] as const)
    $setTableBorders(table, [merged], edge, border[edge])

  return merged
}

export function $unmergeTableCellWithBorders() {
  const selected = $getSelectedTableCells()
  const cell = selected[0]

  if (!cell) return
  const table = $getTableNodeFromLexicalNodeOrThrow(cell)
  const before = $tableCellGeometry(table)

  const original =
    before.geometry.placements[
      before.cells.findIndex((candidate) => candidate.is(cell))
    ]

  if (!original) return
  const border = expandTableBorder($getState(cell, tableCellBorderState))
  $unmergeCell()
  const after = $tableCellGeometry(table)

  for (const [index, slot] of after.geometry.placements.entries()) {
    const current = after.cells[index]

    if (
      !current ||
      slot.row < original.row ||
      slot.row >= original.row + original.rowSpan ||
      slot.column < original.column ||
      slot.column >= original.column + original.colSpan
    )
      continue

    const state = {
      top: slot.row === original.row ? border.top : null,
      bottom:
        slot.row + slot.rowSpan === original.row + original.rowSpan
          ? border.bottom
          : null,
      start: slot.column === original.column ? border.start : null,
      end:
        slot.column + slot.colSpan === original.column + original.colSpan
          ? border.end
          : null,
    }

    $setState(
      current,
      tableCellBorderState,
      Object.values(state).every((value) => value === null) ? null : state,
    )
  }
}

export function $setTableBorders(
  table: TableNode,
  selected: readonly TableCellNode[],
  operation: TableBorderOperation,
  border: "solid" | "hidden" | null = "solid",
) {
  const { cells, geometry } = $tableCellGeometry(table)

  const chosen = new Set(
    selected.flatMap((cell) =>
      cells.some((candidate) => candidate.is(cell)) ? [cell.getKey()] : [],
    ),
  )

  const selectedSlots = geometry.placements.filter((_, index) =>
    chosen.has(cells[index]?.getKey() ?? ""),
  )

  if (!selectedSlots.length) return
  const top = Math.min(...selectedSlots.map((slot) => slot.row))

  const bottom = Math.max(
    ...selectedSlots.map((slot) => slot.row + slot.rowSpan),
  )

  const start = Math.min(...selectedSlots.map((slot) => slot.column))

  const end = Math.max(
    ...selectedSlots.map((slot) => slot.column + slot.colSpan),
  )

  const updates = new Map<TableCellNode, ReturnType<typeof expandTableBorder>>()

  const sharedEdges = new Map<
    string,
    ReturnType<typeof getTableEdgeGroups>[number]
  >()

  for (const group of getTableEdgeGroups(geometry.placements))
    for (const entry of group)
      sharedEdges.set(`${entry.index}:${entry.edge}`, group)

  function set(
    cell: TableCellNode,
    edge: TableBorderEdge,
    value: "solid" | "hidden" | null,
  ) {
    const index = cells.findIndex((candidate) => candidate.is(cell))

    for (const entry of sharedEdges.get(`${index}:${edge}`) ?? []) {
      const current = cells[entry.index]

      if (!current) continue

      const state = updates.get(current) ?? {
        ...expandTableBorder($getState(current, tableCellBorderState)),
      }

      state[entry.edge] = value
      updates.set(current, state)
    }
  }

  for (const [index, slot] of geometry.placements.entries()) {
    const cell = cells[index]

    if (!cell || !chosen.has(cell.getKey())) continue

    const outside = {
      top: slot.row === top,
      bottom: slot.row + slot.rowSpan === bottom,
      start: slot.column === start,
      end: slot.column + slot.colSpan === end,
    }

    for (const edge of ["top", "bottom", "start", "end"] as const) {
      if (
        (operation === "outside" && !outside[edge]) ||
        (operation === "inside" && outside[edge])
      )
        continue

      if (
        !["all", "none", "reset", "outside", "inside"].includes(operation) &&
        operation !== edge
      )
        continue

      const value =
        operation === "reset" ? null : operation === "none" ? "hidden" : border

      set(cell, edge, value)
    }
  }

  for (const [cell, state] of updates)
    $setState(
      cell,
      tableCellBorderState,
      Object.values(state).every((value) => value === null) ? null : state,
    )
}

function $decorateCell(node: TableCellNode, dom: HTMLElement) {
  const widths = node.getParents().find($isTableNode)?.getColWidths()
  dom.style.minInlineSize = widths ? "0" : ""
  dom.style.overflowWrap = widths ? "anywhere" : ""
  const border = $getState(node, tableCellBorderState)

  const managed = dom.hasAttribute("data-editor-border")

  if (border === null && !managed) return
  const defaultStyle = managed ? "" : dom.style.borderStyle

  if (border !== null)
    dom.setAttribute(
      "data-editor-border",
      border === "solid" || border === "hidden"
        ? border
        : JSON.stringify(border),
    )
  else dom.removeAttribute("data-editor-border")
  dom.style.removeProperty("box-shadow")
  dom.style.removeProperty("border-style")
  const edges = expandTableBorder(border)
  dom.style.borderTopStyle = edges.top ?? defaultStyle
  dom.style.borderBottomStyle = edges.bottom ?? defaultStyle
  dom.style.borderInlineStartStyle = edges.start ?? defaultStyle
  dom.style.borderInlineEndStyle = edges.end ?? defaultStyle
}

function $decorateTable(node: TableNode, dom: HTMLElement, exporting = false) {
  const table = dom.matches("table") ? dom : dom.querySelector("table")

  if (!table) return
  const widths = node.getColWidths()
  table.style.tableLayout = widths ? "fixed" : ""
  table.style.inlineSize = widths
    ? `${widths.reduce((sum, value) => sum + clampTableColumnWidth(value), 0)}px`
    : ""

  for (const cell of table.querySelectorAll<HTMLElement>("td, th")) {
    cell.style.minInlineSize = widths ? "0" : ""
    cell.style.overflowWrap = widths ? "anywhere" : ""
  }

  const { cells, geometry } = $tableCellGeometry(node)
  const elements = Array.from(table.querySelectorAll<HTMLElement>("td, th"))

  if (elements.length !== cells.length) return

  for (const group of getTableEdgeGroups(geometry.placements)) {
    const values = group.map((entry) => {
      const cell = cells[entry.index]

      return cell
        ? expandTableBorder($getState(cell, tableCellBorderState))[entry.edge]
        : null
    })

    const value = values.includes("solid")
      ? "solid"
      : values.includes("hidden")
        ? "hidden"
        : exporting
          ? "solid"
          : ""

    for (const entry of group) {
      const element = elements[entry.index]

      if (!element) continue

      if (entry.edge === "top") element.style.borderTopStyle = value

      if (entry.edge === "bottom") element.style.borderBottomStyle = value

      if (entry.edge === "start") element.style.borderInlineStartStyle = value

      if (entry.edge === "end") element.style.borderInlineEndStyle = value
    }
  }
}

function tableCellImport(): DOMConversionMap {
  TableCellNode.getType()
  const imports = TableCellNode.importDOM?.()

  function conversion(element: HTMLElement) {
    const original = imports?.[element.nodeName.toLowerCase()]?.(element)

    if (!original) return null

    return {
      ...original,
      conversion(dom: HTMLElement) {
        const border = readTableBorderHTML(dom)
        const output = original.conversion(dom)

        if (output)
          for (const node of Array.isArray(output.node)
            ? output.node
            : [output.node]) {
            if (!$isTableCellNode(node)) continue
            $setState(node, tableCellBorderState, border)
          }

        return output
      },
    }
  }

  return { td: conversion, th: conversion }
}

function registerTablePaste(editor: LexicalEditor, pasteTsv: boolean) {
  return editor.registerCommand(
    PASTE_COMMAND,
    (event) => {
      if (
        !editor.isEditable() ||
        !event ||
        !("clipboardData" in event) ||
        !event.clipboardData
      )
        return false
      const data = event.clipboardData
      const html = data.getData("text/html")
      const text = data.getData("text/plain")
      const lexical = data.getData("application/x-lexical-editor")

      if (
        html.length + text.length + lexical.length > TABLE_MAX_INPUT_BYTES ||
        new TextEncoder().encode(html + text + lexical).byteLength >
          TABLE_MAX_INPUT_BYTES
      ) {
        event.preventDefault()
        editor.dispatchCommand(
          TABLE_PRESENTATION_ERROR_COMMAND,
          new Error("Clipboard exceeds table input budget."),
        )

        return true
      }

      if (lexical) {
        try {
          const clipboard = z
            .object({ nodes: z.array(z.unknown()).max(TABLE_MAX_NODES) })
            .parse(JSON.parse(lexical))

          tablePresentationDocumentSchema.parse({
            root: { type: "root", children: clipboard.nodes },
          })
        } catch (error) {
          event.preventDefault()
          editor.dispatchCommand(
            TABLE_PRESENTATION_ERROR_COMMAND,
            error instanceof Error
              ? error
              : new Error("Invalid clipboard table."),
          )

          return true
        }

        return false
      }

      if (html) {
        const document = editor.getRootElement()?.ownerDocument
        const Parser = document?.defaultView?.DOMParser

        if (!Parser) {
          event.preventDefault()
          editor.dispatchCommand(
            TABLE_PRESENTATION_ERROR_COMMAND,
            new Error("HTML table validation is unavailable."),
          )

          return true
        }

        const parsed = new Parser().parseFromString(html, "text/html")

        try {
          validateTablePresentationHTML(parsed)
        } catch (error) {
          event.preventDefault()
          editor.dispatchCommand(
            TABLE_PRESENTATION_ERROR_COMMAND,
            error instanceof Error
              ? error
              : new Error("Invalid clipboard table."),
          )

          return true
        }

        return false
      }

      if (!pasteTsv || data.getData("text/csv") || !text.includes("\t"))
        return false
      event.preventDefault()

      const rows = text
        .replace(/\r\n?/g, "\n")
        .replace(/\n$/, "")
        .split("\n", TABLE_MAX_ROWS + 1)
        .map((row) => row.split("\t", TABLE_MAX_COLUMNS + 1))

      const columns = rows.reduce(
        (maximum, row) => Math.max(maximum, row.length),
        0,
      )

      if (
        rows.length > TABLE_MAX_ROWS ||
        columns > TABLE_MAX_COLUMNS ||
        rows.length * columns > TABLE_MAX_CELLS
      ) {
        editor.dispatchCommand(
          TABLE_PRESENTATION_ERROR_COMMAND,
          new Error("TSV exceeds table dimensions."),
        )

        return true
      }

      const table = $createTableNodeWithDimensions(rows.length, columns, false)

      for (const [rowIndex, row] of table.getChildren().entries()) {
        if (!$isTableRowNode(row)) continue

        for (const [columnIndex, cell] of row.getChildren().entries()) {
          if (!$isTableCellNode(cell)) continue
          const paragraph = cell.getFirstChild()

          if ($isElementNode(paragraph))
            paragraph.append(
              $createTextNode(rows[rowIndex]?.[columnIndex] ?? ""),
            )
        }
      }

      const selected = $getSelectedTableCells()[0]

      if (selected) {
        $getTableNodeFromLexicalNodeOrThrow(selected).insertAfter(table)
      } else $insertNodes([table])
      table.selectStart()

      return true
    },
    COMMAND_PRIORITY_HIGH,
  )
}

function $decorateRow(node: TableRowNode, element: HTMLElement) {
  const height = node.getHeight()

  if (height === undefined) element.removeAttribute("data-editor-row-height")
  else element.setAttribute("data-editor-row-height", String(height))
}

export function createEditorTablePresentationHTMLConfig() {
  TableNode.getType()
  TableCellNode.getType()
  TableRowNode.getType()

  const exports = new Map<
    Klass<LexicalNode>,
    (editor: LexicalEditor, node: LexicalNode) => DOMExportOutput
  >()

  for (const klass of [TableNode, TableRowNode, TableCellNode]) {
    exports.set(klass, (editor, node) => {
      const output = node.exportDOM(editor)

      function apply(element: typeof output.element | undefined) {
        if (isHTMLElement(element)) {
          if ($isTableNode(node)) $decorateTable(node, element, true)

          if ($isTableCellNode(node)) $decorateCell(node, element)

          if ($isTableRowNode(node)) $decorateRow(node, element)
        }

        return element
      }

      apply(output.element)

      return {
        ...output,
        after(element) {
          return apply(output.after ? output.after(element) : element)
        },
      }
    })
  }

  const imports: DOMConversionMap = {
    ...TableNode.importDOM?.(),
    ...TableRowNode.importDOM?.(),
    ...tableCellImport(),
    tr(this: void, element: HTMLElement) {
      const previous = TableRowNode.importDOM?.()?.tr?.(element)

      if (!previous) return null

      return {
        ...previous,
        conversion(dom: HTMLElement) {
          const output = previous.conversion(dom)
          const value = dom.getAttribute("data-editor-row-height")

          if (!output || value === null) return output
          const height = parseTableRowHeightHTML(value)

          if (height === undefined)
            throw new TablePresentationError(
              "Invalid table row height metadata.",
            )

          const nodes = Array.isArray(output.node) ? output.node : [output.node]

          for (const node of nodes)
            if ($isTableRowNode(node)) node.setHeight(height)

          return output
        },
      }
    },
  }

  return {
    import: imports,
    export: exports,
  }
}

export const editorTablePresentationHTML =
  createEditorTablePresentationHTMLConfig()

export function registerTablePresentationValidation(editor: LexicalEditor) {
  return editor.registerNodeTransform(RootNode, () => {
    let count = 0

    function serialize(
      node: LexicalNode,
      depth: number,
    ): SerializedLexicalNode & { children?: SerializedLexicalNode[] } {
      count += 1

      if (count > TABLE_MAX_NODES || depth > TABLE_MAX_DEPTH)
        throw new TablePresentationError(
          "Table document exceeds traversal budget.",
        )
      const value = node.exportJSON()

      if (!$isElementNode(node)) return value
      const children = node.getChildren()

      if (children.length + count > TABLE_MAX_NODES)
        throw new TablePresentationError("Table document exceeds node budget.")

      return {
        ...value,
        children: children.map((child) => serialize(child, depth + 1)),
      }
    }

    const result = tablePresentationDocumentSchema.safeParse({
      root: serialize($getRoot(), 0),
    })

    if (!result.success)
      throw new TablePresentationError("Invalid table state.")
  })
}

export const EditorTablePresentationExtension = defineExtension({
  name: "@yopem-ui/editor/table-presentation",
  config: { pasteTsv: true },
  dependencies: [TableExtension],
  html: editorTablePresentationHTML,
  init(editorConfig) {
    const previousError = editorConfig.onError

    function handleTableError(error: Error, editor: LexicalEditor) {
      if (error instanceof TablePresentationError) {
        queueMicrotask(() => {
          editor.dispatchCommand(TABLE_PRESENTATION_ERROR_COMMAND, error)
        })

        return
      }

      if (previousError) previousError(error, editor)
      else throw error
    }

    editorConfig.onError = handleTableError
  },
  register(editor, config) {
    return mergeRegister(
      registerTablePaste(editor, config.pasteTsv),
      editor.registerUpdateListener(({ editorState, dirtyElements }) => {
        if (editor._headless) return
        editorState.read(() => {
          const tables = new Set<TableNode>()

          for (const key of dirtyElements.keys()) {
            const node = $getNodeByKey(key)
            const dom = editor.getElementByKey(key)

            if (!dom) continue

            if ($isTableNode(node)) tables.add(node)

            if ($isTableRowNode(node)) $decorateRow(node, dom)

            if ($isTableCellNode(node)) {
              $decorateCell(node, dom)
              tables.add($getTableNodeFromLexicalNodeOrThrow(node))
            }
          }

          for (const table of tables) {
            const element = editor.getElementByKey(table.getKey())

            if (element) $decorateTable(table, element)
          }
        })
      }),
      registerTablePresentationValidation(editor),
    )
  },
})

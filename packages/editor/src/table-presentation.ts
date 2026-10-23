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

const borderSchema = z.enum(["solid", "hidden"]).nullable().catch(null)

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

function $decorateCell(node: TableCellNode, dom: HTMLElement) {
  const widths = node.getParents().find($isTableNode)?.getColWidths()
  dom.style.minInlineSize = widths ? "0" : ""
  dom.style.overflowWrap = widths ? "anywhere" : ""
  const border = $getState(node, tableCellBorderState)

  if (border) {
    dom.setAttribute("data-editor-border", border)
    dom.style.borderStyle = "hidden"
    dom.style.boxShadow =
      border === "solid" ? "inset 0 0 0 1px currentColor" : "none"
  } else if (dom.hasAttribute("data-editor-border")) {
    dom.removeAttribute("data-editor-border")
    dom.style.removeProperty("border-style")
    dom.style.removeProperty("box-shadow")
  }
}

function $decorateTable(node: TableNode, dom: HTMLElement) {
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
        const output = original.conversion(dom)

        if (output)
          for (const node of Array.isArray(output.node)
            ? output.node
            : [output.node]) {
            if (!$isTableCellNode(node)) continue
            $setState(
              node,
              tableCellBorderState,
              tableCellBorderState.parse(
                dom.getAttribute("data-editor-border"),
              ),
            )
          }

        return output
      },
    }
  }

  return { td: conversion, th: conversion }
}

function registerTablePaste(editor: LexicalEditor) {
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

      if (!text.includes("\t")) return false
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
          if ($isTableNode(node)) $decorateTable(node, element)

          if ($isTableCellNode(node)) $decorateCell(node, element)
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

  return {
    import: {
      ...TableNode.importDOM?.(),
      ...TableRowNode.importDOM?.(),
      ...tableCellImport(),
    },
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
  register(editor) {
    return mergeRegister(
      registerTablePaste(editor),
      editor.registerUpdateListener(({ editorState, dirtyElements }) => {
        if (editor._headless) return
        editorState.read(() => {
          for (const key of dirtyElements.keys()) {
            const node = $getNodeByKey(key)
            const dom = editor.getElementByKey(key)

            if (!dom) continue

            if ($isTableNode(node)) $decorateTable(node, dom)

            if ($isTableCellNode(node)) $decorateCell(node, dom)
          }
        })
      }),
      registerTablePresentationValidation(editor),
    )
  },
})

import { z } from "zod"

export const TABLE_MIN_COLUMN_WIDTH = 48

export const TABLE_MAX_COLUMN_WIDTH = 640

export const TABLE_MAX_ROWS = 50

export const TABLE_MAX_COLUMNS = 50

export const TABLE_MAX_CELLS = 2500

export const TABLE_MAX_DEPTH = 64

export const TABLE_MAX_NODES = 10_000

export const TABLE_MAX_INPUT_BYTES = 1_048_576

export function parseTableRowHeightHTML(value: string | null) {
  if (
    value === null ||
    value.length > 32 ||
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)
  )
    return undefined
  const height = Number(value)

  return Number.isFinite(height) ? height : undefined
}

export interface TableSpan {
  colSpan?: number
  rowSpan?: number
}

export function getTableSpanGeometry(rows: readonly (readonly TableSpan[])[]) {
  if (!rows.length || rows.length > TABLE_MAX_ROWS)
    throw new Error("Invalid table row count.")
  const occupied = Array.from({ length: rows.length }, () => new Set<number>())

  const placements: {
    row: number
    column: number
    rowSpan: number
    colSpan: number
  }[] = []

  let columns = 0
  let cells = 0

  for (const [rowIndex, row] of rows.entries()) {
    let column = 0

    for (const cell of row) {
      const colSpan = cell.colSpan ?? 1
      const rowSpan = cell.rowSpan ?? 1

      if (
        !Number.isInteger(colSpan) ||
        !Number.isInteger(rowSpan) ||
        colSpan < 1 ||
        rowSpan < 1 ||
        colSpan > TABLE_MAX_COLUMNS ||
        rowSpan > TABLE_MAX_ROWS
      )
        throw new Error("Invalid table span.")

      while (occupied[rowIndex]?.has(column)) column += 1

      if (
        column + colSpan > TABLE_MAX_COLUMNS ||
        rowIndex + rowSpan > rows.length
      )
        throw new Error("Table span exceeds bounds.")
      placements.push({ row: rowIndex, column, rowSpan, colSpan })
      cells += colSpan * rowSpan

      if (cells > TABLE_MAX_CELLS) throw new Error("Table exceeds cell budget.")

      for (let y = rowIndex; y < rowIndex + rowSpan; y += 1) {
        for (let x = column; x < column + colSpan; x += 1) {
          const slots = occupied[y]

          if (!slots || slots.has(x))
            throw new Error("Overlapping table spans.")
          slots.add(x)
        }
      }

      column += colSpan
      columns = Math.max(columns, column)
    }
  }

  if (!columns || occupied.some((slots) => slots.size !== columns))
    throw new Error("Table contains holes.")

  return { rows: rows.length, columns, cells, placements }
}

export function getTableEdgeGroups(
  placements: ReturnType<typeof getTableSpanGeometry>["placements"],
) {
  const lines = new Map<
    string,
    { index: number; edge: TableBorderEdge; start: number; end: number }[]
  >()

  function add(
    line: string,
    index: number,
    edge: TableBorderEdge,
    start: number,
    end: number,
  ) {
    const entries = lines.get(line) ?? []
    entries.push({ index, edge, start, end })
    lines.set(line, entries)
  }

  for (const [index, slot] of placements.entries()) {
    add(`h:${slot.row}`, index, "top", slot.column, slot.column + slot.colSpan)
    add(
      `h:${slot.row + slot.rowSpan}`,
      index,
      "bottom",
      slot.column,
      slot.column + slot.colSpan,
    )
    add(`v:${slot.column}`, index, "start", slot.row, slot.row + slot.rowSpan)
    add(
      `v:${slot.column + slot.colSpan}`,
      index,
      "end",
      slot.row,
      slot.row + slot.rowSpan,
    )
  }

  const groups: { index: number; edge: TableBorderEdge }[][] = []

  for (const entries of lines.values()) {
    entries.sort((left, right) => left.start - right.start)
    let end = -1
    let group: { index: number; edge: TableBorderEdge }[] = []

    for (const entry of entries) {
      if (entry.start >= end) {
        group = []
        groups.push(group)
      }

      group.push({ index: entry.index, edge: entry.edge })
      end = entry.start >= end ? entry.end : Math.max(end, entry.end)
    }
  }

  return groups
}

export function validateTableGeometry(rows: readonly (readonly TableSpan[])[]) {
  const { rows: rowCount, columns, cells } = getTableSpanGeometry(rows)

  return { rows: rowCount, columns, cells }
}

export function isTablePresentationBackground(value: string) {
  if (/^#[\da-f]{6}$/i.test(value)) return true

  const match =
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(value)

  return match?.slice(1).every((channel) => Number(channel) <= 255) ?? false
}

export const tableBorderEdgeSchema = z.enum(["solid", "hidden"]).nullable()

export const tableBorderSchema = z.union([
  tableBorderEdgeSchema,
  z.strictObject({
    top: tableBorderEdgeSchema,
    bottom: tableBorderEdgeSchema,
    start: tableBorderEdgeSchema,
    end: tableBorderEdgeSchema,
  }),
])

export type TableBorder = z.infer<typeof tableBorderSchema>

export type TableBorderEdge = "top" | "bottom" | "start" | "end"

export function parseTableBorderHTML(value: string | null): TableBorder {
  if (value === null || value === "solid" || value === "hidden") return value

  if (value.length > 128) throw new Error("Table border exceeds size limit.")

  return tableBorderSchema.parse(JSON.parse(value))
}

const rowSchema = z.object({ height: z.number().optional() })

const nodeSchema = z.object({
  type: z.string(),
  children: z.array(z.unknown()).max(TABLE_MAX_NODES).optional(),
})

const cellSchema = z.object({
  type: z.literal("tablecell"),
  colSpan: z.number().int().min(1).max(TABLE_MAX_COLUMNS).optional(),
  rowSpan: z.number().int().min(1).max(TABLE_MAX_ROWS).optional(),
  width: z
    .number()
    .min(TABLE_MIN_COLUMN_WIDTH)
    .max(TABLE_MAX_COLUMN_WIDTH)
    .optional(),
  backgroundColor: z
    .string()
    .refine(isTablePresentationBackground)
    .nullable()
    .optional(),
  $: z
    .object({
      yopemTableBorder: tableBorderSchema.optional(),
    })
    .optional(),
})

const tableSchema = z.object({
  colWidths: z
    .array(z.number().min(TABLE_MIN_COLUMN_WIDTH).max(TABLE_MAX_COLUMN_WIDTH))
    .max(TABLE_MAX_COLUMNS)
    .optional(),
})

export const tablePresentationDocumentSchema = z
  .object({ root: z.unknown() })
  .superRefine((document, context) => {
    const pending = [
      { value: document.root, depth: 0, inTable: false, parent: "" },
    ]

    let count = 0
    let cells = 0

    try {
      while (pending.length) {
        const entry = pending.pop()

        if (!entry) break
        count += 1

        if (entry.depth > TABLE_MAX_DEPTH || count > TABLE_MAX_NODES)
          throw new Error("Table document exceeds traversal budget.")
        const node = nodeSchema.parse(entry.value)

        if (
          (entry.depth === 0 && node.type !== "root") ||
          (entry.inTable && node.type === "table") ||
          (node.type === "tablerow" && entry.parent !== "table") ||
          (node.type === "tablecell" && entry.parent !== "tablerow")
        )
          throw new Error("Invalid table structure.")

        if (node.type === "tablecell") cellSchema.parse(entry.value)

        if (node.type === "tablerow") rowSchema.parse(entry.value)

        if (node.type === "table") {
          const presentation = tableSchema.parse(entry.value)
          const rows = node.children ?? []

          if (rows.length > TABLE_MAX_ROWS)
            throw new Error("Table exceeds row limit.")

          const geometry = validateTableGeometry(
            rows.map((row) => {
              const parsed = nodeSchema.parse(row)

              if (parsed.type !== "tablerow")
                throw new Error("Invalid table row.")
              const children = parsed.children ?? []

              if (children.length > TABLE_MAX_COLUMNS)
                throw new Error("Table exceeds column limit.")

              return children.map((cell) => cellSchema.parse(cell))
            }),
          )

          if (
            presentation.colWidths &&
            presentation.colWidths.length !== geometry.columns
          )
            throw new Error("Table widths do not match columns.")
          cells += geometry.cells

          if (cells > TABLE_MAX_CELLS)
            throw new Error("Document exceeds table cell budget.")
        }

        for (const child of node.children ?? [])
          pending.push({
            value: child,
            depth: entry.depth + 1,
            inTable: entry.inTable || node.type === "table",
            parent: node.type,
          })

        if (pending.length + count > TABLE_MAX_NODES)
          throw new Error("Table document exceeds node budget.")
      }
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error ? error.message : "Invalid table document.",
      })
    }
  })

export function parseTablePresentationJSON(input: string) {
  if (
    input.length > TABLE_MAX_INPUT_BYTES ||
    new TextEncoder().encode(input).byteLength > TABLE_MAX_INPUT_BYTES
  )
    throw new Error("Table document exceeds size limit.")
  const document: unknown = JSON.parse(input)
  tablePresentationDocumentSchema.parse(document)

  return input
}

export function readTableBorderHTML(cell: HTMLElement) {
  const border = cell.getAttribute("data-editor-border")

  for (const side of [
    "top",
    "bottom",
    "left",
    "right",
    "inline-start",
    "inline-end",
    "block-start",
    "block-end",
  ]) {
    const style = cell.style.getPropertyValue(`border-${side}-style`)
    const size = cell.style.getPropertyValue(`border-${side}-width`)

    const color = cell.style
      .getPropertyValue(`border-${side}-color`)
      .toLowerCase()

    if (
      (style && style !== "solid" && style !== "hidden") ||
      (style === "hidden" && !border) ||
      (size && size !== "1px") ||
      (color && !["black", "rgb(0, 0, 0)", "currentcolor"].includes(color))
    )
      throw new Error("Unsupported table border CSS.")
  }

  for (const property of cell.style)
    if (property.startsWith("border") && /radius|image/.test(property))
      throw new Error("Unsupported table border CSS.")

  return parseTableBorderHTML(border)
}

export function validateTablePresentationHTML(document: Document) {
  const elements = document.querySelectorAll("*")

  if (elements.length > TABLE_MAX_NODES)
    throw new Error("HTML exceeds node budget.")

  for (const element of elements) {
    let depth = 0

    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      depth += 1

      if (depth > TABLE_MAX_DEPTH) throw new Error("HTML exceeds depth limit.")
    }
  }

  let cells = 0

  for (const table of document.querySelectorAll("table")) {
    if (table.parentElement?.closest("table"))
      throw new Error("Nested tables are not supported.")

    const rows = Array.from(table.rows, (row) => {
      const value = row.getAttribute("data-editor-row-height")

      const height =
        value === null
          ? row.style.height
            ? row.style.height.endsWith("px")
              ? (parseTableRowHeightHTML(row.style.height.slice(0, -2)) ?? NaN)
              : NaN
            : undefined
          : parseTableRowHeightHTML(value)

      if (value !== null && height === undefined)
        throw new Error("Invalid table row height metadata.")
      rowSchema.parse({ height })

      return Array.from(row.cells, (cell) => {
        const width = cell.style.width
        const backgroundColor = cell.style.backgroundColor
        const border = readTableBorderHTML(cell)

        return cellSchema.parse({
          type: "tablecell",
          colSpan: Number(cell.getAttribute("colspan") ?? 1),
          rowSpan: Number(cell.getAttribute("rowspan") ?? 1),
          width: width
            ? /^\d+(?:\.\d+)?px$/.test(width)
              ? Number.parseFloat(width)
              : NaN
            : undefined,
          backgroundColor: backgroundColor || null,
          $: { yopemTableBorder: border },
        })
      })
    })

    const geometry = validateTableGeometry(rows)

    const widths = Array.from(
      table.querySelectorAll<HTMLTableColElement>(":scope > colgroup > col"),
      (column) => {
        const width = column.style.width || column.getAttribute("width")

        return width === null
          ? undefined
          : /^\d+(?:\.\d+)?(?:px)?$/.test(width)
            ? Number.parseFloat(width)
            : NaN
      },
    )

    if (widths.some((width) => width !== undefined)) {
      const presentation = tableSchema.parse({ colWidths: widths })

      if (presentation.colWidths?.length !== geometry.columns)
        throw new Error("Table widths do not match columns.")
    }

    cells += geometry.cells

    if (cells > TABLE_MAX_CELLS)
      throw new Error("HTML exceeds table cell budget.")
  }
}

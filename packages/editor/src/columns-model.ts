import { z } from "zod"

import { isElement } from "./dom"

export const EDITOR_COLUMNS_MINIMUM = 12

export const EDITOR_COLUMNS_MAXIMUM = 76

export const EDITOR_COLUMNS_MIN_COUNT = 2

export const EDITOR_COLUMNS_MAX_COUNT = 4

export const EDITOR_COLUMNS_MAX_DEPTH = 64

export const EDITOR_COLUMNS_MAX_NODES = 10000

export const EDITOR_COLUMNS_MAX_BYTES = 1_048_576

const layoutSchema = z
  .array(
    z.number().int().min(EDITOR_COLUMNS_MINIMUM).max(EDITOR_COLUMNS_MAXIMUM),
  )
  .min(EDITOR_COLUMNS_MIN_COUNT)
  .max(EDITOR_COLUMNS_MAX_COUNT)
  .refine((layout) => layout.reduce((sum, width) => sum + width, 0) === 100)

const documentSchema = z.object({ root: z.unknown() })

const nodeSchema = z.looseObject({
  type: z.string().min(1).max(128),
  children: z.array(z.unknown()).max(EDITOR_COLUMNS_MAX_NODES).optional(),
  $slots: z.record(z.string(), z.unknown()).optional(),
})

const groupSchema = z.looseObject({
  type: z.literal("editor-columns-group"),
  version: z.literal(1),
  layout: layoutSchema,
  children: z
    .array(z.unknown())
    .min(EDITOR_COLUMNS_MIN_COUNT)
    .max(EDITOR_COLUMNS_MAX_COUNT),
})

const columnSchema = z.looseObject({
  type: z.literal("editor-column"),
  version: z.literal(1),
  children: z.array(z.unknown()).min(1).max(EDITOR_COLUMNS_MAX_NODES),
})

export type EditorColumnsLayout = z.infer<typeof layoutSchema>

export function parseEditorColumnsLayout(value: readonly number[]) {
  if (
    value.length < EDITOR_COLUMNS_MIN_COUNT ||
    value.length > EDITOR_COLUMNS_MAX_COUNT
  )
    throw new Error("Invalid editor column layout")

  return layoutSchema.parse(value)
}

export function resizeEditorColumnsLayout(
  value: readonly number[],
  boundary: number,
  requestedWidth: number,
) {
  const layout = parseEditorColumnsLayout(value)

  if (
    !Number.isInteger(boundary) ||
    boundary < 0 ||
    boundary >= layout.length - 1 ||
    !Number.isFinite(requestedWidth)
  )
    throw new Error("Invalid editor column resize")

  const firstColumnWidth = layout[boundary]
  const secondColumnWidth = layout[boundary + 1]

  if (firstColumnWidth === undefined || secondColumnWidth === undefined)
    throw new Error("Invalid editor column resize")
  const pairWidth = firstColumnWidth + secondColumnWidth

  const minimum = Math.max(
    EDITOR_COLUMNS_MINIMUM,
    pairWidth - EDITOR_COLUMNS_MAXIMUM,
  )

  const maximum = Math.min(
    EDITOR_COLUMNS_MAXIMUM,
    pairWidth - EDITOR_COLUMNS_MINIMUM,
  )

  const firstWidth = Math.max(
    minimum,
    Math.min(maximum, Math.round(requestedWidth)),
  )

  const next = [...layout]

  next[boundary] = firstWidth
  next[boundary + 1] = pairWidth - firstWidth

  return parseEditorColumnsLayout(next)
}

export function moveEditorColumnsLayout(
  value: readonly number[],
  from: number,
  to: number,
) {
  const layout = parseEditorColumnsLayout(value)

  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to < 0 ||
    from >= layout.length ||
    to >= layout.length
  )
    throw new Error("Invalid editor column move")

  const next = [...layout]
  const width = next[from]

  if (width === undefined) throw new Error("Invalid editor column move")
  next.splice(from, 1)
  next.splice(to, 0, width)

  return parseEditorColumnsLayout(next)
}

export function editorColumnsHTMLAttributes(value: readonly number[]) {
  const layout = parseEditorColumnsLayout(value)

  return {
    "data-editor-columns": "1",
    "data-editor-columns-layout": layout.join(","),
  }
}

export function editorColumnsFromHTMLAttributes(
  attributes: Record<string, string | null | undefined>,
) {
  const value = attributes["data-editor-columns-layout"]

  if (
    attributes["data-editor-columns"] !== "1" ||
    !value ||
    !/^\d+(?:,\d+){1,3}$/.test(value)
  )
    throw new Error("Invalid editor columns HTML")

  return parseEditorColumnsLayout(value.split(",").map(Number))
}

export function validateEditorColumnsJSON(
  value: z.input<typeof documentSchema>,
) {
  stringifyBounded(value)
  const document = documentSchema.parse(value)
  let count = 0

  function visit(
    input: Parameters<typeof nodeSchema.parse>[0],
    depth: number,
    parent: string,
    insideColumns: boolean,
  ) {
    if (depth > EDITOR_COLUMNS_MAX_DEPTH || ++count > EDITOR_COLUMNS_MAX_NODES)
      throw new Error("Editor columns document exceeds limits")

    const node = nodeSchema.parse(input)

    if (node.type === "editor-columns-group") {
      if (insideColumns)
        throw new Error("Nested editor columns are not supported")
      const group = groupSchema.parse(node)

      if (group.children.length !== group.layout.length)
        throw new Error("Editor columns count does not match layout")

      for (const child of group.children) columnSchema.parse(child)
    } else if (node.type === "editor-column") {
      if (parent !== "editor-columns-group")
        throw new Error("Orphan editor column")
      columnSchema.parse(node)
    } else if (
      node.type.startsWith("editor-columns-") ||
      node.type.startsWith("editor-column-")
    ) {
      throw new Error("Unsupported editor column node")
    }

    for (const child of node.children ?? [])
      visit(
        child,
        depth + 1,
        node.type,
        insideColumns || node.type === "editor-columns-group",
      )

    for (const slot of Object.values(node.$slots ?? {}))
      visit(
        slot,
        depth + 1,
        "",
        insideColumns || node.type === "editor-columns-group",
      )
  }

  const root = nodeSchema.parse(document.root)

  if (root.type !== "root") throw new Error("Invalid editor columns document")
  visit(root, 0, "", false)
}

export function validateEditorColumnsColumnJSON(
  value: z.input<typeof columnSchema>,
) {
  columnSchema.parse(value)
}

export function validateEditorColumnsHTML(root: ParentNode & Node) {
  const encoder = new TextEncoder()
  const elements: Element[] = []
  let nodeCount = 0
  let byteLength = 0

  function measure(node: Node, depth: number) {
    if (
      depth > EDITOR_COLUMNS_MAX_DEPTH ||
      ++nodeCount > EDITOR_COLUMNS_MAX_NODES
    )
      throw new Error("Editor columns HTML exceeds limits")

    if (isElement(node)) {
      elements.push(node)
      byteLength += encoder.encode(
        `<${node.tagName}></${node.tagName}>`,
      ).byteLength

      for (const attribute of Array.from(node.attributes)) {
        if (
          attribute.name.length + attribute.value.length >
          EDITOR_COLUMNS_MAX_BYTES
        )
          throw new Error("Editor columns HTML exceeds byte limit")
        byteLength += encoder.encode(
          `${attribute.name}="${attribute.value}"`,
        ).byteLength
      }
    } else if (node.nodeType === 3 || node.nodeType === 8) {
      const text = node.nodeValue ?? ""

      if (text.length > EDITOR_COLUMNS_MAX_BYTES)
        throw new Error("Editor columns HTML exceeds byte limit")
      byteLength += encoder.encode(text).byteLength
    }

    if (byteLength > EDITOR_COLUMNS_MAX_BYTES)
      throw new Error("Editor columns HTML exceeds byte limit")

    for (const child of node.childNodes) measure(child, depth + 1)
  }

  measure(root, 0)

  for (const element of elements) {
    if (
      element.hasAttribute("data-editor-columns") ||
      element.hasAttribute("data-editor-columns-layout")
    ) {
      const layout = editorColumnsFromHTMLAttributes({
        "data-editor-columns": element.getAttribute("data-editor-columns"),
        "data-editor-columns-layout": element.getAttribute(
          "data-editor-columns-layout",
        ),
      })

      const children = Array.from(element.children)

      if (
        element.tagName !== "DIV" ||
        element.parentElement?.closest("[data-editor-columns]") ||
        children.length !== layout.length ||
        children.some(
          (child) =>
            child.tagName !== "DIV" ||
            child.getAttribute("data-editor-column") !== "1",
        )
      )
        throw new Error("Invalid editor columns HTML structure")
    }

    if (element.hasAttribute("data-editor-column")) {
      const parent = element.parentElement

      if (
        element.tagName !== "DIV" ||
        element.getAttribute("data-editor-column") !== "1" ||
        !parent?.hasAttribute("data-editor-columns")
      )
        throw new Error("Orphan editor column HTML")
    }
  }
}

export function parseEditorColumnsJSON(source: string) {
  if (new TextEncoder().encode(source).byteLength > EDITOR_COLUMNS_MAX_BYTES)
    throw new Error("Editor columns JSON exceeds byte limit")

  const parsed: unknown = JSON.parse(source)
  const value = documentSchema.parse(parsed)
  validateEditorColumnsJSON(value)

  return value
}

export function editorColumnsToMarkdown(
  layoutValue: readonly number[],
  columnsValue: readonly string[],
) {
  const layout = parseEditorColumnsLayout(layoutValue)

  if (columnsValue.length !== layout.length)
    throw new Error("Editor columns content does not match layout")

  const columns = columnsValue.map((value) => {
    if (value.length > EDITOR_COLUMNS_MAX_BYTES)
      throw new Error("Editor columns Markdown exceeds byte limit")

    return escapeColumnMarkdown(value)
  })

  const output = [
    `:::editor-columns v1 ${layout.join(",")}`,
    ...columns.flatMap((column) => [":::editor-column", column]),
    ":::end-editor-columns",
  ].join("\n")

  if (new TextEncoder().encode(output).byteLength > EDITOR_COLUMNS_MAX_BYTES)
    throw new Error("Editor columns Markdown exceeds byte limit")

  return output
}

export function editorColumnsFromMarkdown(source: string) {
  if (new TextEncoder().encode(source).byteLength > EDITOR_COLUMNS_MAX_BYTES)
    throw new Error("Editor columns Markdown exceeds byte limit")

  const lines = source.replace(/\r\n?/g, "\n").split("\n")

  if (lines.at(-1) === "") lines.pop()

  const header = /^:::editor-columns v1 (\d+(?:,\d+){1,3})$/.exec(
    lines[0] ?? "",
  )

  if (!header || lines.at(-1) !== ":::end-editor-columns")
    throw new Error("Invalid editor columns Markdown")

  const rawLayout = header[1]

  if (!rawLayout) throw new Error("Invalid editor columns Markdown")
  const layout = parseEditorColumnsLayout(rawLayout.split(",").map(Number))
  const columns: string[] = []
  let index = 1

  while (index < lines.length - 1) {
    if (lines[index] !== ":::editor-column")
      throw new Error("Invalid editor columns Markdown")
    index += 1
    const content: string[] = []

    while (
      index < lines.length - 1 &&
      lines[index] !== ":::editor-column" &&
      lines[index] !== ":::end-editor-columns"
    ) {
      const line = lines[index]

      if (line === undefined) throw new Error("Invalid editor columns Markdown")
      content.push(unescapeColumnMarkdown(line))
      index += 1
    }

    columns.push(content.join("\n"))
  }

  if (columns.length !== layout.length)
    throw new Error("Editor columns content does not match layout")

  return { layout, columns }
}

function stringifyBounded<T>(value: T) {
  try {
    const serialized = z.string().parse(JSON.stringify(value))

    if (
      new TextEncoder().encode(serialized).byteLength > EDITOR_COLUMNS_MAX_BYTES
    )
      throw new Error("Editor columns document exceeds byte limit")

    return serialized
  } catch {
    throw new Error("Invalid editor columns JSON")
  }
}

function escapeColumnMarkdown(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) =>
      line.startsWith("\\") ||
      line === ":::editor-column" ||
      line === ":::end-editor-columns"
        ? `\\${line}`
        : line,
    )
    .join("\n")
}

function unescapeColumnMarkdown(value: string) {
  return value.startsWith("\\") &&
    (value.slice(1).startsWith("\\") ||
      value.slice(1) === ":::editor-column" ||
      value.slice(1) === ":::end-editor-columns")
    ? value.slice(1)
    : value
}

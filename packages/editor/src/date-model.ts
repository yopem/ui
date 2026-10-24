import { z } from "zod"

import { isElement } from "./dom"

export const EDITOR_DATE_MAX_DEPTH = 64

export const EDITOR_DATE_MAX_NODES = 10000

export const EDITOR_DATE_MAX_BYTES = 1_048_576

const datePattern = /^\d{4}-\d{2}-\d{2}$/

const dateSchema = z
  .string()
  .length(10)
  .regex(datePattern)
  .refine(isGregorianDate)

const documentSchema = z.object({ root: z.unknown() })

const nodeSchema = z.looseObject({
  type: z.string().min(1).max(128),
  children: z.array(z.unknown()).max(EDITOR_DATE_MAX_NODES).optional(),
})

export const editorDateNodeSchema = z.strictObject({
  type: z.literal("editor-date"),
  version: z.literal(1),
  date: dateSchema,
})

export type EditorDateValue = z.infer<typeof dateSchema>

export function parseEditorDate(value: string) {
  return dateSchema.parse(value)
}

export function editorDateHTMLAttributes(value: EditorDateValue) {
  const date = parseEditorDate(value)

  return { "data-editor-date": "1", datetime: date }
}

export function editorDateFromHTMLAttributes(
  attributes: Record<string, string | null | undefined>,
) {
  if (attributes["data-editor-date"] !== "1")
    throw new Error("Invalid editor date HTML")

  return dateSchema.parse(attributes.datetime)
}

export function editorDateToMarkdown(value: EditorDateValue) {
  const date = parseEditorDate(value)

  return `<time data-editor-date="1" datetime="${date}">${date}</time>`
}

export function editorDateFromMarkdown(value: string) {
  if (new TextEncoder().encode(value).byteLength > EDITOR_DATE_MAX_BYTES)
    throw new Error("Editor date Markdown exceeds byte limit")

  const match =
    /^<time data-editor-date="1" datetime="(\d{4}-\d{2}-\d{2})">(\d{4}-\d{2}-\d{2})<\/time>$/.exec(
      value,
    )

  if (!match || match[1] !== match[2])
    throw new Error("Invalid editor date Markdown")

  return parseEditorDate(match[1])
}

export function formatEditorDate(value: EditorDateValue, locale?: string) {
  const date = parseEditorDate(value)
  const { year, month, day } = dateParts(date)
  const instant = createUTCDate(year, month, day)

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(instant)
}

export function editorDateToCalendarDate(value: EditorDateValue) {
  const date = parseEditorDate(value)
  const { year, month, day } = dateParts(date)

  return createLocalDate(year, month, day)
}

export function editorDateFromCalendarDate(value: Date) {
  return editorDateFromLocalDate(value)
}

export function editorDateFromLocalDate(value: Date) {
  if (!Number.isFinite(value.getTime()))
    throw new Error("Invalid local editor date")

  return parseEditorDate(
    [
      String(value.getFullYear()).padStart(4, "0"),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-"),
  )
}

export function validateEditorDateJSON(value: z.input<typeof documentSchema>) {
  stringifyBounded(value)
  const document = documentSchema.parse(value)
  const root = nodeSchema.parse(document.root)

  if (root.type !== "root") throw new Error("Invalid editor date document")
  let count = 0

  function visit(input: Parameters<typeof nodeSchema.parse>[0], depth: number) {
    if (depth > EDITOR_DATE_MAX_DEPTH || ++count > EDITOR_DATE_MAX_NODES)
      throw new Error("Editor date document exceeds limits")

    const node = nodeSchema.parse(input)

    if (node.type === "editor-date") editorDateNodeSchema.parse(node)
    else if (node.type.startsWith("editor-date-"))
      throw new Error("Unsupported editor date node")

    for (const child of node.children ?? []) visit(child, depth + 1)
  }

  visit(root, 0)
}

export function validateEditorDateHTML(root: ParentNode & Node) {
  const encoder = new TextEncoder()
  const elements: Element[] = []
  let nodeCount = 0
  let byteLength = 0

  function measure(node: Node, depth: number) {
    if (depth > EDITOR_DATE_MAX_DEPTH || ++nodeCount > EDITOR_DATE_MAX_NODES)
      throw new Error("Editor date HTML exceeds limits")

    if (isElement(node)) {
      elements.push(node)
      byteLength += encoder.encode(
        `<${node.tagName}></${node.tagName}>`,
      ).byteLength

      for (const attribute of Array.from(node.attributes)) {
        if (
          attribute.name.length + attribute.value.length >
          EDITOR_DATE_MAX_BYTES
        )
          throw new Error("Editor date HTML exceeds byte limit")
        byteLength += encoder.encode(
          `${attribute.name}="${attribute.value}"`,
        ).byteLength
      }
    } else if (node.nodeType === 3 || node.nodeType === 8) {
      const text = node.nodeValue ?? ""

      if (text.length > EDITOR_DATE_MAX_BYTES)
        throw new Error("Editor date HTML exceeds byte limit")
      byteLength += encoder.encode(text).byteLength
    }

    if (byteLength > EDITOR_DATE_MAX_BYTES)
      throw new Error("Editor date HTML exceeds byte limit")

    for (const child of node.childNodes) measure(child, depth + 1)
  }

  measure(root, 0)

  for (const element of elements) {
    if (element.hasAttribute("data-editor-date")) {
      const date = editorDateFromHTMLAttributes({
        "data-editor-date": element.getAttribute("data-editor-date"),
        datetime: element.getAttribute("datetime"),
      })

      if (
        element.tagName !== "TIME" ||
        element.children.length > 0 ||
        element.textContent !== date
      )
        throw new Error("Invalid editor date HTML structure")
    }
  }
}

export function parseEditorDateJSON(source: string) {
  if (new TextEncoder().encode(source).byteLength > EDITOR_DATE_MAX_BYTES)
    throw new Error("Editor date JSON exceeds byte limit")

  const parsed: unknown = JSON.parse(source)
  const value = documentSchema.parse(parsed)
  validateEditorDateJSON(value)

  return value
}

function isGregorianDate(value: string) {
  if (!datePattern.test(value)) return false
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (year < 1 || month < 1 || month > 12) return false

  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const monthLength = days[month - 1]

  return monthLength !== undefined && day >= 1 && day <= monthLength
}

function dateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) throw new Error("Invalid editor date")

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

function createUTCDate(year: number, month: number, day: number) {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(12, 0, 0, 0)

  return date
}

function createLocalDate(year: number, month: number, day: number) {
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(12, 0, 0, 0)

  return date
}

function stringifyBounded<T>(value: T) {
  try {
    const serialized = z.string().parse(JSON.stringify(value))

    if (new TextEncoder().encode(serialized).byteLength > EDITOR_DATE_MAX_BYTES)
      throw new Error("Editor date JSON exceeds byte limit")
  } catch {
    throw new Error("Invalid editor date JSON")
  }
}

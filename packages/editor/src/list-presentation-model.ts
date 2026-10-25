import { type ListNode, type ListType } from "@lexical/list"
import { $getState, $setState, createState } from "lexical"
import { z } from "zod"

export const EDITOR_LIST_MARKER_ATTRIBUTE = "data-editor-list-marker"

export const EDITOR_LIST_START_MIN = -2_147_483_648

export const EDITOR_LIST_START_MAX = 2_147_483_647

export const EDITOR_BULLET_LIST_MARKERS = ["disc", "circle", "square"] as const

export const EDITOR_ORDERED_LIST_MARKERS = [
  "decimal",
  "lower-alpha",
  "upper-alpha",
  "lower-roman",
  "upper-roman",
] as const

export const editorListMarkerSchema = z.enum([
  ...EDITOR_BULLET_LIST_MARKERS,
  ...EDITOR_ORDERED_LIST_MARKERS,
])

export type EditorListMarker = z.infer<typeof editorListMarkerSchema>

const bulletListMarkerSchema = z.enum(EDITOR_BULLET_LIST_MARKERS)

const orderedListMarkerSchema = z.enum(EDITOR_ORDERED_LIST_MARKERS)

const editorListStartSchema = z
  .number()
  .int()
  .min(EDITOR_LIST_START_MIN)
  .max(EDITOR_LIST_START_MAX)

export const editorListMarkerState = createState("yopemListMarker", {
  parse(value) {
    return value === undefined ? undefined : editorListMarkerSchema.parse(value)
  },
})

export function parseEditorListMarker(value: string) {
  return editorListMarkerSchema.parse(value)
}

export function parseEditorListMarkerHTML(attributes: {
  marker: string | null
  listStyleType: string
}) {
  if (attributes.marker !== null)
    return editorListMarkerSchema.parse(attributes.marker)
  const parsed = editorListMarkerSchema.safeParse(attributes.listStyleType)

  return parsed.success ? parsed.data : undefined
}

export function isEditorListStart(value: unknown): value is number {
  return editorListStartSchema.safeParse(value).success
}

export function parseEditorListStart(value: number) {
  return editorListStartSchema.parse(value)
}

export function parseEditorListStartHTML(value: string | null) {
  const normalized = value?.trim()

  if (normalized === undefined || !/^-?\d+$/.test(normalized)) return undefined
  const parsed = editorListStartSchema.safeParse(Number(normalized))

  return parsed.success ? parsed.data : undefined
}

export function isEditorListMarkerForType(
  marker: EditorListMarker,
  listType: ListType,
) {
  return listType === "bullet"
    ? bulletListMarkerSchema.safeParse(marker).success
    : listType === "number" && orderedListMarkerSchema.safeParse(marker).success
}

export function $getEditorListMarker(node: ListNode) {
  return $getState(node, editorListMarkerState)
}

export function $setEditorListMarker(
  node: ListNode,
  marker: EditorListMarker | undefined,
) {
  $setState(node, editorListMarkerState, marker)
}

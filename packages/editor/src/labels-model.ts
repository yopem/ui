import { z } from "zod"

export const EDITOR_LABEL_MAX_COUNT = 10

export const EDITOR_LABEL_MAX_OPTIONS = 64

export const EDITOR_LABEL_MAX_LENGTH = 128

export type EditorLabelJSON =
  | string
  | number
  | boolean
  | null
  | readonly EditorLabelJSON[]
  | { readonly [key: string]: EditorLabelJSON }

export const editorLabelSchema = z
  .string()
  .min(1)
  .max(EDITOR_LABEL_MAX_LENGTH)
  .refine(
    (value) =>
      value.trim() === value && !/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(value),
  )

export const editorLabelNodeSchema = z
  .strictObject({
    type: z.literal("editor-label"),
    version: z.literal(1),
    label: editorLabelSchema,
    text: editorLabelSchema,
    format: z.number().int().min(0).max(65535),
    detail: z.number().int().min(0).max(3),
    mode: z.literal("token"),
    style: z.string().max(4096),
  })
  .refine((node) => node.text === node.label)

export type SerializedEditorLabelData = z.infer<typeof editorLabelNodeSchema>

function isEditorLabelJSONArray(
  value: EditorLabelJSON,
): value is readonly EditorLabelJSON[] {
  return Array.isArray(value)
}

export function parseEditorLabelOptions(
  value: EditorLabelJSON,
): readonly string[] | null {
  if (
    !isEditorLabelJSONArray(value) ||
    value.length < 1 ||
    value.length > EDITOR_LABEL_MAX_OPTIONS
  )
    return null

  const options: string[] = []
  const seen = new Set<string>()

  for (const item of value) {
    const parsed = editorLabelSchema.safeParse(item)

    if (!parsed.success || seen.has(parsed.data)) return null

    options.push(parsed.data)
    seen.add(parsed.data)
  }

  return Object.freeze(options)
}

export function decodeEditorLabels(
  value: EditorLabelJSON,
  options: EditorLabelJSON,
): readonly string[] | null {
  const parsedOptions = parseEditorLabelOptions(options)

  if (
    !parsedOptions ||
    !isEditorLabelJSONArray(value) ||
    value.length > EDITOR_LABEL_MAX_COUNT
  )
    return null

  const allowed = new Set(parsedOptions)
  const seen = new Set<string>()
  const labels: string[] = []

  for (const item of value) {
    const parsed = editorLabelSchema.safeParse(item)

    if (!parsed.success || !allowed.has(parsed.data) || seen.has(parsed.data))
      return null

    labels.push(parsed.data)
    seen.add(parsed.data)
  }

  return Object.freeze(labels)
}

export function decodeEditorLabelNode(
  value: EditorLabelJSON,
): SerializedEditorLabelData | null {
  const parsed = editorLabelNodeSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}

import type { ElementNode } from "lexical"

import { $getState, createState } from "lexical"
import { z } from "zod"

export function isEditorStyleLength(value: string, max: number) {
  const match = /^(\d+(?:\.\d+)?)(px|rem|em)$/.exec(value)

  return (
    match !== null &&
    Number.isFinite(Number(match[1])) &&
    Number(match[1]) <= (match[2] === "px" ? max : max / 16)
  )
}

export function isEditorLineHeight(value: string) {
  return /^(?:[1-3](?:\.\d+)?|4(?:\.0+)?)$/.test(value)
}

const blockSchema = z
  .object({
    lineHeight: z
      .string()
      .refine((value) => value === "" || isEditorLineHeight(value))
      .catch(""),
    textIndent: z
      .string()
      .refine((value) => value === "" || isEditorStyleLength(value, 160))
      .catch(""),
  })
  .catch({ lineHeight: "", textIndent: "" })

export type EditorBlockPresentation = z.infer<typeof blockSchema>

export const parseEditorBlockPresentation = blockSchema.parse.bind(blockSchema)

export const editorBlockPresentationState = createState(
  "editorBlockPresentation",
  {
    parse: parseEditorBlockPresentation,
  },
)

export function $getEditorBlockPresentation(node: ElementNode) {
  return $getState(node, editorBlockPresentationState)
}

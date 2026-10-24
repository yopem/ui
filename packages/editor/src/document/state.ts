import type { LexicalNode } from "lexical"

import {
  editorBlockPresentationState,
  isEditorLineHeight,
  isEditorStyleLength,
} from "@yopem-ui/editor/block-presentation"
import {
  tableBorderSchema,
  validateTableGeometry,
} from "@yopem-ui/editor/table-presentation-schema"
import { $setState, createState } from "lexical"
import { z } from "zod"

import { DocumentError } from "./boundary"

const presentationSchema = z.strictObject({
  lineHeight: z
    .string()
    .refine((value) => value === "" || isEditorLineHeight(value)),
  textIndent: z
    .string()
    .refine((value) => value === "" || isEditorStyleLength(value, 160)),
})

export const documentStateSchema = z
  .object({
    editorBlockPresentation: presentationSchema.optional(),
    yopemTableBorder: tableBorderSchema.optional(),
    codeWrap: z.boolean().optional(),
    codeLineNumbers: z.boolean().optional(),
  })
  .catchall(z.json())

const borderState = createState("yopemTableBorder", {
  parse(value) {
    return value === undefined ? null : tableBorderSchema.parse(value)
  },
})

export function getDocumentState(node: LexicalNode) {
  const result = documentStateSchema.safeParse(node.exportJSON().$ ?? {})

  if (!result.success)
    throw new DocumentError([
      `Invalid document NodeState: ${result.error.message}`,
    ])

  return result.data
}

export function setDocumentState(
  node: LexicalNode,
  state: z.infer<typeof documentStateSchema>,
) {
  if (state.editorBlockPresentation)
    $setState(node, editorBlockPresentationState, state.editorBlockPresentation)

  if (state.yopemTableBorder !== undefined)
    $setState(node, borderState, state.yopemTableBorder)

  for (const [key, value] of Object.entries(state)) {
    if (key === "editorBlockPresentation" || key === "yopemTableBorder")
      continue
    $setState(
      node,
      createState(key, {
        parse(input) {
          return input === undefined ? undefined : z.json().parse(input)
        },
      }),
      value,
    )
  }
}

export function checkTableGrid(
  rows: readonly (readonly { colSpan: number; rowSpan: number }[])[],
) {
  try {
    return validateTableGeometry(rows).cells
  } catch (error) {
    throw new DocumentError([
      error instanceof Error ? error.message : "Invalid table geometry.",
    ])
  }
}

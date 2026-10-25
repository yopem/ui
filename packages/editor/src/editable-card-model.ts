import { z } from "zod"

export const editorEditableCardNodeSchema = z.strictObject({
  type: z.literal("editor-editable-card"),
  version: z.literal(1),
})

export type SerializedEditorEditableCardNode = z.infer<
  typeof editorEditableCardNodeSchema
>

export function parseEditorEditableCardNode<Value>(value: Value) {
  return editorEditableCardNodeSchema.parse(value)
}

export function editorEditableCardHTMLAttributes() {
  return { "data-editor-editable-card": "1" } as const
}

export function editorEditableCardFromHTMLAttributes(
  attributes: Record<string, string | null | undefined>,
) {
  if (attributes["data-editor-editable-card"] !== "1")
    throw new Error("Invalid editable card HTML.")

  return parseEditorEditableCardNode({
    type: "editor-editable-card",
    version: 1,
  })
}

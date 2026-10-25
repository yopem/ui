import { z } from "zod"

export const EDITOR_DIAGRAM_KINDS = [
  "mermaid",
  "plantuml",
  "graphviz",
  "flowchart",
] as const

export const EDITOR_DIAGRAM_VIEW_MODES = ["code", "image", "both"] as const

export const EDITOR_DIAGRAM_MAX_SOURCE_BYTES = 131_072

export const EDITOR_DIAGRAM_MAX_SVG_BYTES = 2_097_152

const editorDiagramSchema = z.strictObject({
  version: z.literal(1),
  kind: z.enum(EDITOR_DIAGRAM_KINDS),
  viewMode: z.enum(EDITOR_DIAGRAM_VIEW_MODES),
})

export const editorDiagramStateSchema = editorDiagramSchema
  .nullable()
  .catch(null)

export type EditorDiagramKind = (typeof EDITOR_DIAGRAM_KINDS)[number]

export type EditorDiagramViewMode = (typeof EDITOR_DIAGRAM_VIEW_MODES)[number]

export type EditorDiagramMetadata = z.infer<typeof editorDiagramSchema>

export type EditorDiagramMetadataInput =
  | string
  | number
  | boolean
  | null
  | readonly EditorDiagramMetadataInput[]
  | { readonly [key: string]: EditorDiagramMetadataInput }

export function createEditorDiagramMetadata(
  kind: EditorDiagramKind,
  viewMode: EditorDiagramViewMode = "both",
): EditorDiagramMetadata {
  return editorDiagramSchema.parse({ version: 1, kind, viewMode })
}

export function parseEditorDiagramMetadata(
  input: EditorDiagramMetadataInput,
): EditorDiagramMetadata | null {
  const parsed = editorDiagramSchema.safeParse(input)

  return parsed.success ? parsed.data : null
}

export function isEditorDiagramKind(value: string): value is EditorDiagramKind {
  return EDITOR_DIAGRAM_KINDS.some((kind) => kind === value)
}

export function isEditorDiagramViewMode(
  value: string,
): value is EditorDiagramViewMode {
  return EDITOR_DIAGRAM_VIEW_MODES.some((viewMode) => viewMode === value)
}

export function validateEditorDiagramSource(source: string): string {
  const parsed = z.string().safeParse(source)

  if (!parsed.success) throw new Error("Diagram source is invalid.")

  if (!parsed.data.trim()) throw new Error("Diagram source is empty.")

  if (
    parsed.data.length > EDITOR_DIAGRAM_MAX_SOURCE_BYTES ||
    new TextEncoder().encode(parsed.data).length >
      EDITOR_DIAGRAM_MAX_SOURCE_BYTES
  )
    throw new Error("Diagram source exceeds the size limit.")

  return parsed.data
}

import type { SerializedLexicalNode } from "lexical"

import { z } from "zod"

export const EDITOR_DRAWING_MAX_BYTES = 524_288

export const EDITOR_DRAWING_MAX_ELEMENTS = 2_000

const maxDepth = 32

const externalValue =
  /(?:https?:\/\/|(?:data|blob|file|javascript|vbscript):|\/\/|url\s*\(|\bwww\.)/i

const blockedKeys = new Set([
  "customData",
  "fileId",
  "files",
  "image",
  "src",
  "url",
])

export interface EditorDrawingJSONObject {
  [key: string]: EditorDrawingJSON
}

export type EditorDrawingJSON =
  | null
  | boolean
  | number
  | string
  | EditorDrawingJSON[]
  | EditorDrawingJSONObject

interface EditorDrawingSceneInput {
  elements: readonly object[]
}

type EditorDrawingValidationInput =
  | EditorDrawingJSON
  | SerializedLexicalNode
  | EditorDrawingSceneInput

function hasWellFormedUnicode(value: string) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)

      if (next < 0xdc00 || next > 0xdfff) return false
      index += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) return false
  }

  return true
}

function validateJSONValue(value: EditorDrawingValidationInput, depth = 0) {
  if (depth > maxDepth) throw new Error("Editor drawing scene is too deep")

  if (value === null || z.boolean().safeParse(value).success) return

  const number = z.number().finite().safeParse(value)

  if (number.success) return

  const text = z.string().safeParse(value)

  if (text.success) {
    if (
      text.data.length > EDITOR_DRAWING_MAX_BYTES ||
      !hasWellFormedUnicode(text.data) ||
      externalValue.test(text.data.trim())
    )
      throw new Error("Editor drawing scene contains an unsupported string")

    return
  }

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype)
      throw new Error("Editor drawing scene must use JSON arrays")

    const keys = Object.keys(value)

    if (
      Object.getOwnPropertySymbols(value).length > 0 ||
      Reflect.ownKeys(value).length !== keys.length + 1
    )
      throw new Error("Editor drawing arrays cannot contain extra properties")

    for (const key of keys) {
      if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)
        throw new Error("Editor drawing arrays cannot contain extra properties")

      const property = Object.getOwnPropertyDescriptor(value, key)

      if (!property?.enumerable || !("value" in property))
        throw new Error("Editor drawing arrays must use JSON values")
    }

    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index))
        throw new Error("Editor drawing scene cannot contain sparse arrays")

      validateJSONValue(value[index], depth + 1)
    }

    return
  }

  if (!isEditorDrawingJSONObject(value))
    throw new Error("Editor drawing scene must contain JSON values")

  if (Object.getPrototypeOf(value) !== Object.prototype)
    throw new Error("Editor drawing scene must use plain JSON objects")

  const keys = Object.keys(value)

  if (Reflect.ownKeys(value).length !== keys.length)
    throw new Error("Editor drawing scene cannot contain symbol keys")

  for (const key of keys) {
    if (blockedKeys.has(key))
      throw new Error("Editor drawing scene contains a blocked key")

    const property = Object.getOwnPropertyDescriptor(value, key)

    if (!property?.enumerable || !("value" in property))
      throw new Error("Editor drawing scene must use JSON properties")

    if (key === "link" && property.value === null) continue

    if (key === "link")
      throw new Error("Editor drawing links are not supported")

    validateJSONValue(value[key], depth + 1)
  }
}

function createJSONSchema(depth: number): z.ZodType<EditorDrawingJSON> {
  const nested = depth < maxDepth ? createJSONSchema(depth + 1) : z.never()

  return z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string().max(EDITOR_DRAWING_MAX_BYTES),
    z.array(nested),
    z.record(
      z.string().refine((key) => !blockedKeys.has(key) || key === "link"),
      nested,
    ),
  ])
}

const jsonValueSchema = createJSONSchema(0)

function isEditorDrawingJSONObject(
  value: EditorDrawingValidationInput,
): value is EditorDrawingJSONObject {
  return value instanceof Object && !Array.isArray(value)
}

const elementSchema = z
  .object({
    id: z.string().min(1).max(128),
    type: z.enum([
      "rectangle",
      "ellipse",
      "diamond",
      "line",
      "arrow",
      "freedraw",
      "text",
    ]),
  })
  .catchall(jsonValueSchema)

const sceneSchema = z.strictObject({
  elements: z.array(elementSchema).max(EDITOR_DRAWING_MAX_ELEMENTS),
})

export type EditorDrawingElement = z.infer<typeof elementSchema>

export interface EditorDrawingScene extends Record<string, EditorDrawingJSON> {
  elements: EditorDrawingElement[]
}

export interface SerializedEditorDrawingNode extends SerializedLexicalNode {
  type: "editor-drawing"
  version: 1
  elements: EditorDrawingElement[]
}

export function parseEditorDrawingScene(
  value: EditorDrawingSceneInput,
): EditorDrawingScene {
  if (
    Array.isArray(value.elements) &&
    value.elements.length > EDITOR_DRAWING_MAX_ELEMENTS
  )
    throw new Error("Editor drawing scene exceeds element limit")

  validateJSONValue(value)
  const input = jsonValueSchema.parse(value)
  const source = JSON.stringify(input)

  if (
    !source ||
    new TextEncoder().encode(source).byteLength > EDITOR_DRAWING_MAX_BYTES
  )
    throw new Error("Editor drawing scene exceeds byte limit")

  return sceneSchema.parse(JSON.parse(source))
}

export function parseEditorDrawingNode(
  value: SerializedLexicalNode | EditorDrawingJSON,
): SerializedEditorDrawingNode {
  validateJSONValue(value)
  const input = jsonValueSchema.parse(value)

  const parsed = z
    .strictObject({
      type: z.literal("editor-drawing"),
      version: z.literal(1),
      elements: sceneSchema.shape.elements,
    })
    .parse(input)

  const source = JSON.stringify(parsed)

  if (
    !source ||
    new TextEncoder().encode(source).byteLength > EDITOR_DRAWING_MAX_BYTES
  )
    throw new Error("Editor drawing scene exceeds byte limit")

  return parsed
}

export function editorDrawingHTMLAttributes(scene: EditorDrawingScene) {
  const parsed = parseEditorDrawingScene(scene)

  return {
    "data-editor-drawing": "1",
    "data-editor-drawing-scene": JSON.stringify(parsed),
  }
}

export function editorDrawingFromHTMLAttributes(
  attributes: Record<string, string | null | undefined>,
) {
  if (attributes["data-editor-drawing"] !== "1")
    throw new Error("Invalid editor drawing HTML")

  const source = attributes["data-editor-drawing-scene"]

  if (
    !source ||
    new TextEncoder().encode(source).byteLength > EDITOR_DRAWING_MAX_BYTES
  )
    throw new Error("Editor drawing HTML exceeds byte limit")

  return parseEditorDrawingScene(JSON.parse(source))
}

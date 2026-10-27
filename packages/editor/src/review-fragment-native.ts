import { z } from "zod"

import { parseReviewDocumentJSON } from "./review-codecs"
import { parseReviewJSONValue } from "./review-validation"

const maxFragmentBytes = 131072

const maxFragmentBlocks = 128

const jsonValueSchema = z.json()

const jsonObjectSchema = z.record(z.string(), jsonValueSchema)

type JsonValue = z.infer<typeof jsonValueSchema>

type NativeFormat =
  | ""
  | "left"
  | "center"
  | "right"
  | "justify"
  | "start"
  | "end"

interface NativeTextNode {
  type: "text"
  version?: 1
  text: string
  format?: number
  detail?: number
  mode?: "normal"
  style?: ""
}

interface NativeLinebreakNode {
  type: "linebreak"
  version?: 1
}

interface NativeParagraphNode {
  type: "paragraph"
  version?: 1
  children: (NativeTextNode | NativeLinebreakNode)[]
  direction?: "ltr" | "rtl" | null
  format?: NativeFormat
  indent?: number
  textFormat?: number
  textStyle?: ""
}

interface NativeListItemNode {
  type: "listitem"
  version?: 1
  children: (NativeTextNode | NativeLinebreakNode | NativeListNode)[]
  checked?: boolean
  value?: number
  direction?: "ltr" | "rtl" | null
  format?: NativeFormat
  indent?: number
  textFormat?: number
  textStyle?: ""
}

interface NativeListNode {
  type: "list"
  version?: 1
  listType: "number" | "bullet" | "check"
  start: number
  tag: "ol" | "ul"
  children: NativeListItemNode[]
  direction?: "ltr" | "rtl" | null
  format?: NativeFormat
  indent?: number
  textFormat?: number
  textStyle?: ""
}

type NativeFragmentBlock = NativeParagraphNode | NativeListNode

type NativeFragmentNode =
  | NativeFragmentBlock
  | NativeListItemNode
  | NativeTextNode
  | NativeLinebreakNode

type NativeFragmentRejection =
  | "invalid-fragment"
  | "namespace-mismatch"
  | "size-limit"

export type EditorReviewNativeFragmentResult =
  | { readonly status: "validated"; readonly blocks: NativeFragmentBlock[] }
  | { readonly status: "rejected"; readonly reason: NativeFragmentRejection }

const nativeFormatSchema = z
  .enum(["", "left", "center", "right", "justify", "start", "end"])
  .optional()

const nativeDirectionSchema = z.enum(["ltr", "rtl"]).nullable().optional()

const nativeElementFields = {
  direction: nativeDirectionSchema,
  format: nativeFormatSchema,
  indent: z.number().int().min(0).max(24).optional(),
  textFormat: z.number().int().min(0).max(255).optional(),
  textStyle: z.literal("").optional(),
}

const nativeTextNodeSchema = z.strictObject({
  type: z.literal("text"),
  version: z.literal(1).optional(),
  text: z.string().max(16384),
  format: z.number().int().min(0).max(255).optional(),
  detail: z.number().int().min(0).max(3).optional(),
  mode: z.literal("normal").optional(),
  style: z.literal("").optional(),
})

const nativeLinebreakNodeSchema = z.strictObject({
  type: z.literal("linebreak"),
  version: z.literal(1).optional(),
})

const nativeParagraphNodeSchema = z.strictObject({
  type: z.literal("paragraph"),
  version: z.literal(1).optional(),
  ...nativeElementFields,
  children: z
    .array(z.union([nativeTextNodeSchema, nativeLinebreakNodeSchema]))
    .max(256),
})

const nativeListItemNodeSchema: z.ZodType<NativeListItemNode> = z.lazy(() =>
  z.strictObject({
    type: z.literal("listitem"),
    version: z.literal(1).optional(),
    ...nativeElementFields,
    checked: z.boolean().optional(),
    value: z.number().int().min(-2147483648).max(2147483647).optional(),
    children: z
      .array(
        z.union([
          nativeTextNodeSchema,
          nativeLinebreakNodeSchema,
          nativeListNodeSchema,
        ]),
      )
      .max(256),
  }),
)

const nativeListNodeSchema: z.ZodType<NativeListNode> = z.lazy(() =>
  z
    .strictObject({
      type: z.literal("list"),
      version: z.literal(1).optional(),
      ...nativeElementFields,
      listType: z.enum(["number", "bullet", "check"]),
      start: z.number().int().min(-2147483648).max(2147483647),
      tag: z.enum(["ol", "ul"]),
      children: z.array(nativeListItemNodeSchema).min(1).max(256),
    })
    .refine((node) => node.tag === (node.listType === "number" ? "ol" : "ul")),
)

const nativeFragmentBlockSchema: z.ZodType<NativeFragmentBlock> = z.lazy(() =>
  z.union([nativeParagraphNodeSchema, nativeListNodeSchema]),
)

const nativeClipboardPayloadSchema = z.strictObject({
  namespace: z.string().min(1).max(128),
  nodes: z.array(jsonValueSchema).min(1).max(maxFragmentBlocks),
})

function stripNodeState(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(stripNodeState)

  if (value === null) return value
  const object = jsonObjectSchema.safeParse(value)

  if (!object.success) return value

  const result: Record<string, JsonValue> = {}

  for (const [key, child] of Object.entries(object.data))
    if (key !== "$") result[key] = stripNodeState(child)

  return result
}

function nativeFragmentHasText(blocks: readonly NativeFragmentBlock[]) {
  const pending: NativeFragmentNode[] = [...blocks]

  while (pending.length) {
    const node = pending.pop()!

    if (node.type === "text" && node.text.length) return true

    if ("children" in node) pending.push(...node.children)
  }

  return false
}

export function parseEditorReviewNativeFragment(
  data: string,
  namespace: string,
): EditorReviewNativeFragmentResult {
  if (
    data.length > maxFragmentBytes ||
    new TextEncoder().encode(data).byteLength > maxFragmentBytes
  )
    return { status: "rejected", reason: "size-limit" }

  try {
    const payload = nativeClipboardPayloadSchema.parse(
      parseReviewJSONValue(data),
    )

    if (payload.namespace !== namespace)
      return { status: "rejected", reason: "namespace-mismatch" }

    const untrusted = parseReviewDocumentJSON(
      JSON.stringify({ root: { type: "root", children: payload.nodes } }),
      false,
      true,
    )

    const root = jsonObjectSchema.parse(untrusted.root)

    const nodes = z
      .array(jsonValueSchema)
      .parse(root.children)
      .map(stripNodeState)

    const blocks = z.array(nativeFragmentBlockSchema).parse(nodes)

    if (!nativeFragmentHasText(blocks))
      return { status: "rejected", reason: "invalid-fragment" }

    return { status: "validated", blocks }
  } catch {
    return { status: "rejected", reason: "invalid-fragment" }
  }
}

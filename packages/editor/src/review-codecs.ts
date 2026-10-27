import { z } from "zod"

import {
  reviewRichContentSchema,
  reviewRichText,
  reviewRichHTML,
} from "./review-richtext"
import { parseEditorReviewStructural } from "./review-structural"
import {
  checkReviewComplexity,
  escapeReviewHTML,
  parseReviewJSONValue,
  reviewStringSchema,
} from "./review-validation"

export { checkReviewComplexity, escapeReviewHTML } from "./review-validation"

export const reviewIdSchema = reviewStringSchema.pipe(
  z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/),
)

export const reviewAuthorSchema = z
  .strictObject({
    id: reviewIdSchema,
    name: reviewStringSchema.pipe(z.string().trim().min(1).max(200)),
  })
  .readonly()

const timeSchema = z.number().int().nonnegative().max(8640000000000000)

export const reviewTextSchema = reviewStringSchema.pipe(
  z.string().trim().min(1).max(16384),
)

const commentSchema = z
  .strictObject({
    id: reviewIdSchema,
    author: reviewAuthorSchema,
    text: reviewTextSchema,
    content: reviewRichContentSchema.optional(),
    createdAt: timeSchema,
    updatedAt: timeSchema,
  })
  .refine(
    (value) =>
      value.updatedAt >= value.createdAt &&
      (!value.content || reviewRichText(value.content).trim() === value.text),
  )
  .readonly()

const threadSchema = z
  .strictObject({
    id: reviewIdSchema,
    resolved: z.boolean(),
    comments: z.array(commentSchema).min(1).max(128).readonly(),
  })
  .readonly()

const reviewSchema = z
  .strictObject({
    version: z.literal(1),
    threads: z.array(threadSchema).max(256).readonly(),
  })
  .readonly()

export type EditorReviewData = z.infer<typeof reviewSchema>

export type EditorReviewAuthor = z.infer<typeof reviewAuthorSchema>

export type EditorReviewThread = EditorReviewData["threads"][number]

export const reviewSuggestionSchema = z
  .strictObject({
    id: reviewIdSchema,
    author: reviewAuthorSchema,
    createdAt: timeSchema,
    kind: z.enum(["insert", "delete", "format"]),
    beforeFormat: z.number().int().min(0).max(0xffff),
  })
  .readonly()

export type EditorSuggestion = z.infer<typeof reviewSuggestionSchema>

export const reviewNativeOperationSchema = z
  .strictObject({
    version: z.literal(1),
    id: reviewIdSchema,
    kind: z.enum(["insert", "delete"]),
  })
  .readonly()

export type EditorReviewNativeOperation = z.infer<
  typeof reviewNativeOperationSchema
>

const reviewNativeOperationTypeSchema = z.enum([
  "paragraph",
  "list",
  "listitem",
])

export const reviewNativeFragmentSchema = z.strictObject({
  version: z.literal(1),
  id: reviewIdSchema,
  author: reviewAuthorSchema,
  createdAt: timeSchema,
  before: z.string().max(131072),
  after: z.string().max(131072),
})

export type EditorReviewNativeFragment = z.infer<
  typeof reviewNativeFragmentSchema
>

export const reviewBreakSuggestionSchema = z
  .strictObject({
    id: reviewIdSchema,
    author: reviewAuthorSchema,
    createdAt: timeSchema,
    kind: z.enum(["paragraph", "linebreak"]),
  })
  .readonly()

export type EditorReviewBreakSuggestion = z.infer<
  typeof reviewBreakSuggestionSchema
>

export function reviewInlineHTML(
  text: string,
  suggestion: EditorSuggestion | null,
) {
  const escaped = escapeReviewHTML(
    z.string().max(1048576).parse(reviewStringSchema.parse(text)),
  )

  if (!suggestion) return escaped
  const value = reviewSuggestionSchema.parse(suggestion)

  const tag =
    value.kind === "insert" ? "ins" : value.kind === "delete" ? "del" : "mark"

  return `<${tag}>${escaped}</${tag}>`
}

function parseNativeFragmentSnapshot(source: string) {
  if (new TextEncoder().encode(source).byteLength > 131072)
    throw new Error("Native review snapshot exceeds its byte limit.")
  const value = parseReviewJSONValue(source)
  const document = z.record(z.string(), z.json()).parse(value)
  const root = z.record(z.string(), z.json()).parse(document.root)

  if (root.type !== "root" || !Array.isArray(root.children))
    throw new Error("Native review snapshots require a root node.")

  const pending = [root]

  while (pending.length) {
    const node = z.record(z.string(), z.json()).parse(pending.pop())
    const state = z.record(z.string(), z.json()).safeParse(node.$)

    if (state.success && state.data.yopemReviewNativeFragment !== undefined)
      throw new Error("Native review snapshots cannot contain fragments.")

    if (Array.isArray(node.children))
      pending.push(
        ...node.children.map((child) =>
          z.record(z.string(), z.json()).parse(child),
        ),
      )

    if (node.$slots !== undefined) {
      const slots = z.record(z.string(), z.json()).parse(node.$slots)
      pending.push(
        ...Object.values(slots).map((child) =>
          z.record(z.string(), z.json()).parse(child),
        ),
      )
    }
  }

  return parseReviewDocument(value, true, true)
}

function validateNativeFragmentSnapshots(fragment: EditorReviewNativeFragment) {
  const before = parseNativeFragmentSnapshot(fragment.before)
  const after = parseNativeFragmentSnapshot(fragment.after)
  let matchedSuggestion = false

  for (const [snapshot, isBefore] of [
    [before, true],
    [after, false],
  ] as const) {
    const root = z.record(z.string(), z.json()).parse(snapshot.root)
    const pending = [root]

    while (pending.length) {
      const node = z.record(z.string(), z.json()).parse(pending.pop())
      const state = z.record(z.string(), z.json()).safeParse(node.$)

      if (state.success) {
        if (
          state.data.yopemReviewStructural !== undefined ||
          state.data.yopemReviewBreak !== undefined
        )
          throw new Error(
            "Native review snapshots cannot contain pending breaks or trees.",
          )

        if (
          state.data.yopemSuggestion !== undefined &&
          state.data.yopemSuggestion !== null
        ) {
          if (isBefore)
            throw new Error(
              "Native review snapshots cannot replace pending suggestions.",
            )

          const suggestion = reviewSuggestionSchema.parse(
            state.data.yopemSuggestion,
          )

          if (
            suggestion.id !== fragment.id ||
            suggestion.kind !== "insert" ||
            suggestion.createdAt !== fragment.createdAt ||
            JSON.stringify(suggestion.author) !==
              JSON.stringify(fragment.author)
          )
            throw new Error(
              "Native review fragment attribution does not match.",
            )

          matchedSuggestion = true
        }
      }

      if (Array.isArray(node.children))
        pending.push(
          ...node.children.map((child) =>
            z.record(z.string(), z.json()).parse(child),
          ),
        )

      if (node.$slots !== undefined) {
        const slots = z.record(z.string(), z.json()).parse(node.$slots)
        pending.push(
          ...Object.values(slots).map((child) =>
            z.record(z.string(), z.json()).parse(child),
          ),
        )
      }
    }
  }

  if (!matchedSuggestion)
    throw new Error("Native review fragment has no inserted text attribution.")
}

export function parseReviewDocumentJSON(
  text: string,
  trusted: boolean,
  allowStructuralTreeDepth = false,
) {
  const input = parseReviewJSONValue(text)

  return parseReviewDocument(input, trusted, allowStructuralTreeDepth)
}

export function parseReviewDocument<Input, Trust>(
  input: Input,
  trust: Trust,
  allowStructuralTreeDepth = false,
) {
  const trusted = z.boolean().parse(trust)
  const allowStructural = z.boolean().parse(allowStructuralTreeDepth)
  checkReviewComplexity(input, 64)
  const value = z.json().parse(input)
  let nodes = 0
  let hasStructuralMetadata = false
  const suggestionIds = new Map<string, string>()
  const breakIds = new Set<string>()
  const entityIds = new Set<string>()

  const nativeOperations: {
    node: object
    operation: EditorReviewNativeOperation
  }[] = []

  const nativeOperationGroupsWithText = new Set<string>()

  function registerSuggestionId(id: string, identity: string) {
    const previous = suggestionIds.get(id)

    if (entityIds.has(id) && previous === undefined)
      throw new Error("Review entity IDs must be unique.")

    if (previous && previous !== identity)
      throw new Error("Inconsistent suggestion attribution.")

    suggestionIds.set(id, identity)
    entityIds.add(id)
  }

  function visit(
    inputNode: z.infer<ReturnType<typeof z.json>>,
    parent?: Record<string, z.infer<ReturnType<typeof z.json>>>,
    index?: number,
  ): z.infer<ReturnType<typeof z.json>>[] {
    const node = z.record(z.string(), z.json()).parse(inputNode)

    if (++nodes > 10000) throw new Error("Review document exceeds node limit.")
    const decodedState = z.record(z.string(), z.json()).safeParse(node.$)

    if (node.$ !== undefined && !decodedState.success)
      throw new Error("Review node state must be an object.")

    if (decodedState.success) {
      const state = decodedState.data
      node.$ = state

      if (state.yopemReviewStructural !== undefined)
        hasStructuralMetadata = true

      if (trusted) {
        if (state.yopemReview !== undefined) {
          if (node.type !== "root" || nodes !== 1)
            throw new Error("Thread metadata requires the root node.")
          const review = parseEditorReview(state.yopemReview)

          for (const thread of review.threads) {
            entityIds.add(thread.id)

            for (const comment of thread.comments) entityIds.add(comment.id)
          }
        }

        if (state.yopemReviewStructural !== undefined) {
          if (node.type !== "root" || nodes !== 1)
            throw new Error(
              "Structural review metadata requires the root node.",
            )

          const structural = parseEditorReviewStructural(
            state.yopemReviewStructural,
          )

          for (const proposal of structural.proposals) {
            if (entityIds.has(proposal.id))
              throw new Error("Review entity IDs must be unique.")
            entityIds.add(proposal.id)
          }
        }

        if (
          state.yopemReviewNativeFragment !== undefined &&
          state.yopemReviewNativeFragment !== null
        ) {
          if (node.type !== "root" || nodes !== 1)
            throw new Error(
              "Native review fragment metadata requires the root node.",
            )

          const fragment = reviewNativeFragmentSchema.parse(
            state.yopemReviewNativeFragment,
          )

          validateNativeFragmentSnapshots(fragment)
          registerSuggestionId(
            fragment.id,
            JSON.stringify([fragment.author, "text", fragment.createdAt]),
          )
        }

        if (
          state.yopemReviewNativeOperation !== undefined &&
          state.yopemReviewNativeOperation !== null
        ) {
          if (!reviewNativeOperationTypeSchema.safeParse(node.type).success)
            throw new Error("Native operation metadata requires a text block.")

          nativeOperations.push({
            node,
            operation: reviewNativeOperationSchema.parse(
              state.yopemReviewNativeOperation,
            ),
          })
        }

        if (
          state.yopemSuggestion !== undefined &&
          state.yopemSuggestion !== null
        ) {
          if (
            node.type !== "text" ||
            (node.mode !== undefined && node.mode !== "normal")
          )
            throw new Error("Suggestion requires a normal text node.")
          const suggestion = reviewSuggestionSchema.parse(state.yopemSuggestion)

          const identity = JSON.stringify([
            suggestion.author,
            suggestion.kind === "format" ? "format" : "text",
            suggestion.createdAt,
          ])

          registerSuggestionId(suggestion.id, identity)
        }

        if (
          state.yopemReviewBreak !== undefined &&
          state.yopemReviewBreak !== null
        ) {
          const suggestion = reviewBreakSuggestionSchema.parse(
            state.yopemReviewBreak,
          )

          if (breakIds.has(suggestion.id))
            throw new Error("Review break IDs must be unique.")
          breakIds.add(suggestion.id)

          const nextSiblingResult =
            index !== undefined && Array.isArray(parent?.children)
              ? z
                  .record(z.string(), z.json())
                  .safeParse(parent.children[index + 1])
              : undefined

          const nextSibling =
            nextSiblingResult?.success === true
              ? nextSiblingResult.data
              : undefined

          const validLocation =
            suggestion.kind === "linebreak"
              ? node.type === "linebreak" &&
                parent !== undefined &&
                parent.type !== "root" &&
                Array.isArray(parent.children) &&
                index !== undefined
              : node.type === "paragraph" &&
                parent?.type === "root" &&
                nextSibling?.type === "paragraph"

          if (!validLocation)
            throw new Error("Review break metadata has an invalid location.")

          registerSuggestionId(
            suggestion.id,
            JSON.stringify([suggestion.author, "text", suggestion.createdAt]),
          )
        }
      } else {
        delete state.yopemReview
        delete state.yopemReviewStructural
        delete state.yopemReviewNativeFragment
        delete state.yopemReviewNativeOperation
        delete state.yopemSuggestion
        delete state.yopemReviewBreak

        if (!Object.keys(state).length) delete node.$
      }
    }

    if (node.type === "mark") {
      if (
        !Array.isArray(node.ids) ||
        node.ids.length < 1 ||
        node.ids.length > 256 ||
        new Set(node.ids).size !== node.ids.length
      )
        throw new Error("Invalid mark IDs.")

      for (const id of node.ids) reviewIdSchema.parse(id)
    }

    if (Array.isArray(node.children))
      node.children = node.children.flatMap((child, childIndex) =>
        visit(child, node, childIndex),
      )

    if (node.$slots !== undefined) {
      const slots = z.record(z.string(), z.json()).parse(node.$slots)

      for (const [key, value] of Object.entries(slots)) {
        const result = visit(value, node)

        if (result.length !== 1)
          throw new Error("A named slot requires one root node.")
        slots[key] = result[0]!
      }

      node.$slots = slots
    }

    if (!trusted && node.type === "mark")
      return Array.isArray(node.children) ? node.children : []

    return [node]
  }

  const document = z.record(z.string(), z.json()).parse(value)

  if (!document.root) throw new Error("Expected a Lexical document.")
  const root = z.record(z.string(), z.json()).parse(document.root)

  if (root.type !== "root") throw new Error("Expected a Lexical root node.")
  document.root = visit(root)[0]!

  for (const { node: operationNode, operation } of nativeOperations) {
    const pending = [
      { node: z.record(z.string(), z.json()).parse(operationNode), root: true },
    ]

    let matched = false

    while (pending.length) {
      const current = pending.pop()

      if (!current) continue

      const state =
        current.node.$ === undefined
          ? {}
          : z.record(z.string(), z.json()).parse(current.node.$)

      const nested = state.yopemReviewNativeOperation

      if (!current.root && nested !== undefined && nested !== null)
        throw new Error("Native operation metadata cannot be nested.")

      if (
        state.yopemReviewBreak !== undefined &&
        state.yopemReviewBreak !== null
      )
        throw new Error(
          "Native operation metadata cannot include review breaks.",
        )

      if (current.node.$slots !== undefined) {
        const slots = z.record(z.string(), z.json()).parse(current.node.$slots)

        if (Object.keys(slots).length)
          throw new Error("Native operations cannot contain named slots.")
      }

      if (current.node.type === "linebreak") {
        if (current.node.children !== undefined)
          throw new Error(
            "Native operation line breaks cannot contain children.",
          )

        if (operation.kind !== "insert")
          throw new Error(
            "Delete operation metadata cannot include line breaks.",
          )

        continue
      }

      if (current.node.type === "text") {
        if (current.node.children !== undefined)
          throw new Error("Native operation text cannot contain children.")

        if (current.node.mode !== undefined && current.node.mode !== "normal")
          throw new Error("Native operation text must use normal mode.")

        if (
          state.yopemSuggestion === undefined ||
          state.yopemSuggestion === null
        )
          throw new Error(
            "Native operation text requires matching attribution.",
          )

        const suggestion = reviewSuggestionSchema.parse(state.yopemSuggestion)

        if (
          suggestion.id !== operation.id ||
          suggestion.kind !== operation.kind
        )
          throw new Error("Native operation text attribution does not match.")

        const text = z.string().safeParse(current.node.text)

        if (!text.success)
          throw new Error("Native operation text must contain string content.")

        matched ||= text.data.length > 0
        continue
      }

      if (!reviewNativeOperationTypeSchema.safeParse(current.node.type).success)
        throw new Error(
          "Native operation metadata contains unsupported content.",
        )

      const children = z.array(z.json()).parse(current.node.children)

      if (operation.kind === "delete" && children.length === 0)
        throw new Error("Delete operation blocks cannot be empty.")

      pending.push(
        ...children.map((child) => ({
          node: z.record(z.string(), z.json()).parse(child),
          root: false,
        })),
      )
    }

    if (matched)
      nativeOperationGroupsWithText.add(
        JSON.stringify([operation.id, operation.kind]),
      )
  }

  for (const { operation } of nativeOperations)
    if (
      !nativeOperationGroupsWithText.has(
        JSON.stringify([operation.id, operation.kind]),
      )
    )
      throw new Error("Native operation metadata has no matching text.")

  checkReviewComplexity(
    document,
    (trusted && hasStructuralMetadata) || allowStructural ? 64 : 24,
  )

  return document
}

export function parseEditorReview<Input>(input: Input): EditorReviewData {
  checkReviewComplexity(input)
  const value = reviewSchema.parse(input)
  const ids = new Set<string>()

  for (const thread of value.threads) {
    for (const id of [
      thread.id,
      ...thread.comments.map((comment) => comment.id),
    ]) {
      if (ids.has(id)) throw new Error("Duplicate review ID.")
      ids.add(id)
    }
  }

  return value
}

export function parseEditorReviewJSON(input: string) {
  reviewStringSchema.parse(input)

  if (input.length > 1048576) throw new Error("Review JSON exceeds size limit.")

  return parseEditorReview(parseReviewJSONValue(input))
}

export function reviewHTML(input: EditorReviewData) {
  const value = parseEditorReview(input)

  return value.threads
    .map(
      (thread) =>
        `<section><h2>${escapeReviewHTML(thread.id)}${thread.resolved ? " (resolved)" : ""}</h2>${thread.comments.map((comment) => `<article><p><strong>${escapeReviewHTML(comment.author.name)}</strong></p>${comment.content ? reviewRichHTML(comment.content) : `<p>${escapeReviewHTML(comment.text)}</p>`}</article>`).join("")}</section>`,
    )
    .join("")
}

export function reviewMarkdown(input: EditorReviewData) {
  const value = parseEditorReview(input)

  return value.threads
    .map(
      (thread) =>
        `## ${thread.id}${thread.resolved ? " (resolved)" : ""}\n\n${thread.comments.map((comment) => `${comment.author.name}: ${comment.text}`.replace(/[\\`*_{}[\]<>#+.!|~-]/g, "\\$&")).join("\n\n")}`,
    )
    .join("\n\n")
}

const clipboardVersion = z.number().int().min(0).max(1000000).optional()

const plainClipboardNodeSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("text"),
    version: clipboardVersion,
    text: z.string().max(1048576),
    detail: z.literal(0).optional(),
    format: z.literal(0).optional(),
    mode: z.literal("normal").optional(),
    style: z.literal("").optional(),
  }),
  z.strictObject({
    type: z.literal("paragraph"),
    version: clipboardVersion,
    children: z.array(z.json()).max(10000),
    direction: z.enum(["ltr", "rtl"]).nullable().optional(),
    format: z.union([z.literal(""), z.literal(0)]).optional(),
    indent: z.literal(0).optional(),
    textFormat: z.literal(0).optional(),
    textStyle: z.literal("").optional(),
  }),
  z.strictObject({ type: z.literal("linebreak"), version: clipboardVersion }),
])

export function sanitizeEditorReviewClipboard(input: string) {
  const parsed: unknown = parseReviewJSONValue(input)
  checkReviewComplexity(parsed)

  const payload = z
    .strictObject({
      namespace: z.string().min(1).max(128),
      nodes: z.array(z.json()).min(1).max(10000),
    })
    .parse(parsed)

  const document = parseReviewDocument(
    { root: { type: "root", children: payload.nodes } },
    false,
  )

  const root = z.record(z.string(), z.json()).parse(document.root)
  const nodes = z.array(z.json()).parse(root.children)
  const pending = [...nodes]

  while (pending.length) {
    const node = plainClipboardNodeSchema.parse(pending.pop())

    if (node.type === "paragraph") pending.push(...node.children)
  }

  return { namespace: payload.namespace, nodes }
}

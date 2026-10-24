import { z } from "zod"

import {
  reviewRichContentSchema,
  reviewRichText,
  reviewRichHTML,
} from "./review-richtext"
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

export function parseReviewDocumentJSON(text: string, trusted: boolean) {
  const input = parseReviewJSONValue(text)

  return parseReviewDocument(input, trusted)
}

export function parseReviewDocument<Input, Trust>(input: Input, trust: Trust) {
  const trusted = z.boolean().parse(trust)
  checkReviewComplexity(input)
  const value = z.json().parse(input)
  let nodes = 0
  const suggestionIds = new Map<string, string>()
  const entityIds = new Set<string>()

  function visit(
    inputNode: z.infer<ReturnType<typeof z.json>>,
  ): z.infer<ReturnType<typeof z.json>>[] {
    const node = z.record(z.string(), z.json()).parse(inputNode)

    if (++nodes > 10000) throw new Error("Review document exceeds node limit.")
    const decodedState = z.record(z.string(), z.json()).safeParse(node.$)

    if (node.$ !== undefined && !decodedState.success)
      throw new Error("Review node state must be an object.")

    if (decodedState.success) {
      const state = decodedState.data
      node.$ = state

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

          if (entityIds.has(suggestion.id))
            throw new Error("Review entity IDs must be unique.")

          const identity = JSON.stringify([
            suggestion.author,
            suggestion.kind === "format" ? "format" : "text",
            suggestion.createdAt,
          ])

          const previous = suggestionIds.get(suggestion.id)

          if (previous && previous !== identity)
            throw new Error("Inconsistent suggestion attribution.")
          suggestionIds.set(suggestion.id, identity)
        }
      } else {
        delete state.yopemReview
        delete state.yopemSuggestion

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
      node.children = node.children.flatMap(visit)

    if (node.$slots !== undefined) {
      const slots = z.record(z.string(), z.json()).parse(node.$slots)

      for (const [key, value] of Object.entries(slots)) {
        const result = visit(value)

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

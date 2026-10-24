import { z } from "zod"

import {
  checkReviewComplexity,
  escapeReviewHTML,
  parseReviewJSONValue,
  reviewStringSchema,
} from "./review-validation"

const alignment = z.literal("").default("")

const direction = z.enum(["ltr", "rtl"]).nullable().default(null)

const textSchema = z
  .strictObject({
    type: z.literal("text"),
    version: z.literal(1).default(1),
    text: z.string().max(16384),
    format: z.number().int().min(0).max(255).default(0),
    detail: z.number().int().min(0).max(3).default(0),
    mode: z.literal("normal").default("normal"),
    style: z.literal("").default(""),
    $: z
      .strictObject({ yopemReviewKeyboard: z.boolean().optional() })
      .readonly()
      .optional(),
  })
  .readonly()

const linebreakSchema = z
  .strictObject({
    type: z.literal("linebreak"),
    version: z.literal(1).default(1),
  })
  .readonly()

const paragraphSchema = z
  .strictObject({
    type: z.literal("paragraph"),
    version: z.literal(1).default(1),
    children: z
      .array(z.union([textSchema, linebreakSchema]))
      .max(128)
      .readonly(),
    direction,
    format: alignment,
    indent: z.literal(0).default(0),
    textFormat: z.number().int().min(0).max(255).default(0),
    textStyle: z.literal("").default(""),
  })
  .readonly()

const baseContentSchema = z
  .strictObject({
    root: z
      .strictObject({
        type: z.literal("root"),
        version: z.literal(1).default(1),
        children: z.array(paragraphSchema).min(1).max(128).readonly(),
        direction,
        format: alignment,
        indent: z.literal(0).default(0),
      })
      .readonly(),
  })
  .readonly()

const contentSchema = baseContentSchema
  .refine(
    (value) =>
      value.root.children.reduce(
        (total, paragraph) => total + paragraph.children.length,
        0,
      ) <= 256 && richText(value).length <= 16384,
  )
  .readonly()

function canonicalRichJSON<Input>(value: Input) {
  checkReviewComplexity(value)
  const text = JSON.stringify(value)

  if (
    text === undefined ||
    text.length > 131072 ||
    new TextEncoder().encode(text).byteLength > 131072
  )
    throw new Error("Rich discussion exceeds its size limit.")

  return parseReviewJSONValue(text)
}

export const reviewRichContentSchema = z.preprocess(
  canonicalRichJSON,
  contentSchema,
)

export type EditorReviewRichContent = z.infer<typeof baseContentSchema>

function richText(value: EditorReviewRichContent) {
  return value.root.children
    .map((paragraph) =>
      paragraph.children
        .map((node) => (node.type === "text" ? node.text : "\n"))
        .join(""),
    )
    .join("\n\n")
}

export function parseReviewRichContent<Input>(value: Input) {
  return reviewRichContentSchema.parse(value)
}

export function makeReviewRichContent(text: string) {
  z.string().max(16384).parse(reviewStringSchema.parse(text))

  return parseReviewRichContent({
    root: {
      type: "root",
      children: text
        .replace(/\r\n/g, "\n")
        .split("\n\n")
        .map((block) => ({
          type: "paragraph",
          children: block
            .split("\n")
            .flatMap((line, index) =>
              index
                ? [{ type: "linebreak" }, { type: "text", text: line }]
                : [{ type: "text", text: line }],
            ),
        })),
    },
  })
}

export function reviewRichText(value: EditorReviewRichContent) {
  return richText(value)
}

export function reviewRichHTML(value: EditorReviewRichContent) {
  const content = parseReviewRichContent(value)

  return content.root.children
    .map(
      (paragraph) =>
        `<p>${paragraph.children
          .map((node) => {
            if (node.type === "linebreak") return "<br>"
            let text = escapeReviewHTML(node.text)

            for (const [flag, tag] of [
              [1, "strong"],
              [2, "em"],
              [4, "s"],
              [8, "u"],
              [16, "code"],
              [32, "sub"],
              [64, "sup"],
              [128, "mark"],
            ] as const)
              if (node.format & flag) text = `<${tag}>${text}</${tag}>`

            if (node.$?.yopemReviewKeyboard) text = `<kbd>${text}</kbd>`

            return text
          })
          .join("")}</p>`,
    )
    .join("")
}

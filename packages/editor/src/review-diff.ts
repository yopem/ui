import { z } from "zod"

export class EditorReviewTextDiffError extends Error {}

export interface EditorReviewTextDiffOperation {
  readonly kind: "equal" | "insert" | "delete"
  readonly text: string
  readonly offset: number
}

const diffTextSchema = z
  .string()
  .max(4096)
  .refine((value) => !/[\r\n]/.test(value))

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

export function reviewTextDiffSegments(text: string) {
  const value = diffTextSchema.safeParse(text)

  if (!value.success) return null

  const parts = Array.from(
    segmenter.segment(value.data),
    (part) => part.segment,
  )

  return parts.length <= 2048 ? parts : null
}

export function deriveReviewTextDiff(before: string, after: string) {
  const source = reviewTextDiffSegments(before)
  const target = reviewTextDiffSegments(after)

  if (!source || !target)
    throw new EditorReviewTextDiffError(
      "Document text diff supports one paragraph, 2048 graphemes, and 4096 UTF-16 units.",
    )
  const stride = target.length + 1
  const table = new Uint16Array((source.length + 1) * stride)

  for (let i = source.length - 1; i >= 0; i--)
    for (let j = target.length - 1; j >= 0; j--)
      table[i * stride + j] =
        source[i] === target[j]
          ? 1 + table[(i + 1) * stride + j + 1]
          : Math.max(table[(i + 1) * stride + j], table[i * stride + j + 1])

  const operations: {
    kind: EditorReviewTextDiffOperation["kind"]
    text: string
    offset: number
  }[] = []

  function append(
    kind: EditorReviewTextDiffOperation["kind"],
    text: string,
    offset: number,
  ) {
    const previous = operations.at(-1)

    if (
      previous?.kind === kind &&
      (kind === "insert"
        ? previous.offset === offset
        : previous.offset + previous.text.length === offset)
    )
      previous.text += text
    else operations.push({ kind, text, offset })
  }

  let i = 0
  let j = 0
  let offset = 0

  while (i < source.length || j < target.length) {
    if (i < source.length && j < target.length && source[i] === target[j]) {
      const text = source[i++]
      append("equal", text, offset)
      offset += text.length
      j++
    } else if (
      i < source.length &&
      (j === target.length ||
        table[(i + 1) * stride + j] >= table[i * stride + j + 1])
    ) {
      const text = source[i++]
      append("delete", text, offset)
      offset += text.length
    } else append("insert", target[j++], offset)
  }

  return Object.freeze(operations.map((operation) => Object.freeze(operation)))
}

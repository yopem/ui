import { z } from "zod"

interface ReviewImportFrame {
  value: unknown
  depth: number
  exit?: object
}

export const reviewStringSchema = z.string()

export function isReviewObject(value: unknown): value is object {
  return value !== null && Object(value) === value
}

export function checkReviewComplexity<Input>(input: Input, depthLimit = 24) {
  const stack: ReviewImportFrame[] = [{ value: input, depth: 0 }]
  const seen = new Set<object>()
  let count = 0
  let bytes = 0
  let arrayWork = 0

  while (stack.length) {
    const item = stack.pop()!

    if (item.exit) {
      seen.delete(item.exit)
      continue
    }

    if (++count > 100000 || item.depth > depthLimit)
      throw new Error("Review input exceeds complexity limit.")
    const value = item.value

    if (
      value === null ||
      value === undefined ||
      value === true ||
      value === false ||
      Number.isFinite(value)
    )
      continue

    if (!isReviewObject(value)) {
      const text = reviewStringSchema.safeParse(value)

      if (!text.success)
        throw new Error("Review input must contain finite JSON values.")
      bytes += text.data.length * 2

      if (bytes > 2097152) throw new Error("Review input exceeds size limit.")
      continue
    }

    if (Array.isArray(value)) {
      if (!Number.isInteger(value.length) || value.length < 0)
        throw new Error("Review input has an invalid collection.")
      arrayWork += value.length

      if (arrayWork + count + stack.length > 100000)
        throw new Error("Review input exceeds collection limit.")
    }

    if (seen.has(value))
      throw new Error("Review input must be an acyclic tree.")
    seen.add(value)
    stack.push({ value: null, depth: item.depth, exit: value })

    if (
      Object.getPrototypeOf(value) !==
      (Array.isArray(value) ? Array.prototype : Object.prototype)
    )
      throw new Error("Review input must contain plain objects.")

    if (Object.getOwnPropertySymbols(value).length)
      throw new Error("Review input cannot contain symbol keys.")
    const keys = Object.getOwnPropertyNames(value)

    if (keys.length + count + stack.length > 100000)
      throw new Error("Review input exceeds collection limit.")

    for (const key of keys) {
      if (["__proto__", "prototype", "constructor"].includes(key))
        throw new Error("Review input contains an unsafe key.")
      const descriptor = Object.getOwnPropertyDescriptor(value, key)

      if (!descriptor || !("value" in descriptor))
        throw new Error("Review input cannot contain accessors.")
      bytes += key.length * 2

      if (bytes > 2097152) throw new Error("Review input exceeds size limit.")
      stack.push({ value: descriptor.value, depth: item.depth + 1 })
    }
  }
}

export function escapeReviewHTML(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  )
}

export function parseReviewJSONValue(text: string) {
  const input = z.string().max(1048576).parse(reviewStringSchema.parse(text))

  if (new TextEncoder().encode(input).byteLength > 1048576)
    throw new Error("Review JSON exceeds its byte limit.")
  const value: unknown = JSON.parse(input)

  return value
}

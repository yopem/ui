import {
  editorMathFromMarkdown,
  editorMathToMarkdown,
} from "@editor/math-model"
import { expect, test } from "bun:test"

test("fragment import rejects ambiguous block delimiters before replacement", () => {
  for (const tex of ["x$y", "x$$y", "x\\\\$y"])
    expect(() => editorMathFromMarkdown(`$$\n${tex}\n$$`)).toThrow()
  const value = { kind: "block" as const, tex: "x\\$y" }
  expect(editorMathFromMarkdown(editorMathToMarkdown(value))).toEqual(value)
})

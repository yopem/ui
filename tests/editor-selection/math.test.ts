import {
  parseEditorMath,
  editorMathToMarkdown,
  editorMathFromMarkdown,
  editorMathHTMLAttributes,
  editorMathFromHTMLAttributes,
} from "@editor/math-model"
import { renderEditorMath } from "@editor/math-render"
import { expect, test } from "bun:test"

test("portable math codecs retain explicit kind and TeX", () => {
  for (const kind of ["inline", "block"] as const) {
    const value = { kind, tex: "\\frac{a}{b} + x^2" }
    expect(parseEditorMath(value)).toEqual(value)
    expect(editorMathFromMarkdown(editorMathToMarkdown(value))).toEqual(value)
    expect(
      editorMathFromHTMLAttributes(editorMathHTMLAttributes(value)),
    ).toEqual(value)
    expect(renderEditorMath(value).ok).toBe(true)
  }
})

test("untrusted math rejects unsafe commands and invalid metadata", () => {
  for (const tex of [
    "",
    "x".repeat(4097),
    "x\u0000",
    "\\href{javascript:alert(1)}{x}",
    "\\htmlClass{evil}{x}",
    "\\def\\x{x}",
    "\\newcommand{\\x}{x}",
    "\\includegraphics{https://host/x}",
  ]) {
    expect(() => parseEditorMath({ kind: "inline", tex })).toThrow()
  }

  for (const value of [
    null,
    [],
    { tex: "x" },
    { kind: "other", tex: "x" },
    { kind: "inline", tex: "x", macros: {} },
  ])
    expect(() => parseEditorMath(value)).toThrow()
  expect(() =>
    editorMathFromHTMLAttributes({ "data-editor-math": "inline" }),
  ).toThrow()
  expect(() => editorMathFromMarkdown("$x$$")).toThrow()
})

test("invalid TeX produces safe error, valid math emits no remote resources", () => {
  expect(renderEditorMath({ kind: "inline", tex: "\\frac{" }).ok).toBe(false)
  const result = renderEditorMath({ kind: "block", tex: "x^2" })
  expect(result.ok).toBe(true)

  if (result.ok) {
    expect(result.html).toContain("<math")
    expect(result.html).not.toMatch(
      /<(script|img|a)\b|https?:\/\/[^"]+\.(woff|css)/,
    )
  }
})

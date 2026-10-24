import { z } from "zod"

export const editorMathSchema = z.strictObject({
  kind: z.enum(["inline", "block"]),
  tex: z
    .string()
    .max(4096)
    .min(1)
    .refine(
      (value) =>
        value.length <= 4096 &&
        value.trim().length > 0 &&
        Array.from(value).every((character) => {
          const code = character.charCodeAt(0)

          return (
            (code >= 32 && code !== 127) ||
            code === 9 ||
            code === 10 ||
            code === 13
          )
        }) &&
        !/\\(?:href|url|includegraphics|html\w*|def|gdef|edef|xdef|let|futurelet|newcommand|renewcommand|providecommand|global|catcode|csname)\b/i.test(
          value,
        ),
    ),
})

export const editorMathNodeSchema = editorMathSchema.extend({
  type: z.literal("editor-math"),
  version: z.literal(1),
})

export type EditorMathValue = z.infer<typeof editorMathSchema>

export function parseEditorMath<Value>(value: Value) {
  return editorMathSchema.parse(value)
}

export function editorMathHTMLAttributes(value: EditorMathValue) {
  const math = parseEditorMath(value)

  return { "data-editor-math": math.kind, "data-editor-tex": math.tex }
}

export function editorMathFromHTMLAttributes(
  attributes: Record<string, string | null | undefined>,
) {
  return parseEditorMath({
    kind: attributes["data-editor-math"],
    tex: attributes["data-editor-tex"],
  })
}

export function editorMathToMarkdown(value: EditorMathValue) {
  const math = parseEditorMath(value)

  if (/(?:^|[^\\])(?:\\\\)*\$/.test(math.tex))
    throw new Error("Ambiguous math delimiter")

  return math.kind === "block" ? `$$\n${math.tex}\n$$` : `$${math.tex}$`
}

export function editorMathFromMarkdown(value: string) {
  if (value.length > 4104) throw new Error("Math fragment exceeds limit")

  const block = /^\$\$\n([\s\S]+)\n\$\$$/.exec(value)
  const inline = /^\$((?:\\[\s\S]|[^$])+)\$$/.exec(value)
  const match = block ?? inline

  if (!match) throw new Error("Invalid math fragment")

  const math = parseEditorMath({
    kind: block ? "block" : "inline",
    tex: match[1] ?? "",
  })

  editorMathToMarkdown(math)

  return math
}

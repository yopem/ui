import { renderToString } from "katex"

import { parseEditorMath, type EditorMathValue } from "./math-model"

export function renderEditorMath(value: EditorMathValue) {
  try {
    const math = parseEditorMath(value)

    const html = renderToString(math.tex, {
      displayMode: math.kind === "block",
      output: "mathml",
      throwOnError: true,
      trust: false,
      strict: "error",
      maxExpand: 100,
      maxSize: 20,
      macros: {},
      globalGroup: false,
    })

    return { ok: true as const, html }
  } catch {
    return { ok: false as const, error: "Invalid TeX expression" }
  }
}

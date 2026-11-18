"use client"

import type { GrammarState } from "@shikijs/core"
import type { ReactNode } from "react"

import { loadHighlighter } from "@registry/components/ui/codeblock-highlighter"
import { useState } from "react"

export function useHighlightedCode(value: string, language: string) {
  const code = value.endsWith("\n") ? value.slice(0, -1) : value
  const highlighter = loadHighlighter(language)

  const [done, setDone] = useState<{
    language: string
    text: string
    lines: ReactNode[]
    state?: GrammarState
  }>({ language, text: "", lines: [] })

  let next = done

  if (next.language !== language || !code.startsWith(next.text)) {
    next = { language, text: "", lines: [] }
  }

  const end = code.lastIndexOf("\n") + 1

  if (highlighter && end > next.text.length) {
    const result = highlighter.highlight(
      code.slice(next.text.length, end - 1),
      next.state,
    )

    next = {
      language,
      text: code.slice(0, end),
      lines: [...next.lines, ...result.lines],
      state: result.state,
    }
  }

  if (next !== done) setDone(next)

  if (!highlighter) return code.split("\n")

  return [
    ...next.lines,
    highlighter.highlight(code.slice(end), next.state).lines[0],
  ]
}

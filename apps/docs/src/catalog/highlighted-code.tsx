import type { ComponentProps } from "react"

import { Box } from "@registry/components/ui/box"
import { createHighlighterCoreSync } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import astro from "@shikijs/langs/astro"
import css from "@shikijs/langs/css"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import shellscript from "@shikijs/langs/shellscript"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"
import { useState } from "react"

const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [astro, css, javascript, json, shellscript, tsx, typescript],
  themes: [githubDark, githubLight],
})

function getCodeLanguage(title: string) {
  if (/\.astro\b/i.test(title)) return "astro"

  if (/\.css\b/i.test(title)) return "css"

  if (/\.json\b/i.test(title)) return "json"

  if (/\.(?:c|m)?js\b/i.test(title)) return "javascript"

  if (/\.ts\b/i.test(title) || /(?:return type|signature)$/i.test(title))
    return "typescript"

  if (/^install\b/i.test(title)) return "shellscript"

  return "tsx"
}

function highlightCode(code: string, title: string, language?: string) {
  return highlighter.codeToHtml(code, {
    defaultColor: "light-dark()",
    lang: language
      ? highlighter.getLoadedLanguages().includes(language)
        ? language
        : "text"
      : getCodeLanguage(title),
    themes: { dark: "github-dark", light: "github-light" },
    transformers: [
      {
        code(node) {
          node.properties.style = "font:inherit"
        },
        pre(node) {
          delete node.properties.tabindex
          delete node.properties.tabIndex
          node.properties.style =
            "margin:0;font:inherit;background:transparent;color:inherit"
        },
      },
    ],
  })
}

export function HighlightedCode({
  code,
  title,
  language,
  ...props
}: ComponentProps<"div"> & {
  code: string
  title: string
  language?: string
}) {
  const [highlight, setHighlight] = useState(() => ({
    code,
    title,
    language,
    html: { __html: highlightCode(code, title, language) },
  }))

  if (
    highlight.code !== code ||
    highlight.title !== title ||
    highlight.language !== language
  ) {
    setHighlight({
      code,
      title,
      language,
      html: { __html: highlightCode(code, title, language) },
    })
  }

  return <Box {...props} dangerouslySetInnerHTML={highlight.html} />
}

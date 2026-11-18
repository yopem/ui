import type { GrammarState } from "@shikijs/core"

import { themeMarker } from "@registry/styles/tokens.stylex"
import { createHighlighterCoreSync } from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"
import css from "@shikijs/langs/css"
import diff from "@shikijs/langs/diff"
import html from "@shikijs/langs/html"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import jsx from "@shikijs/langs/jsx"
import markdown from "@shikijs/langs/markdown"
import python from "@shikijs/langs/python"
import shellscript from "@shikijs/langs/shellscript"
import sql from "@shikijs/langs/sql"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import yaml from "@shikijs/langs/yaml"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light-high-contrast"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  token: (color: string, backgroundColor: string) => ({
    color,
    backgroundColor,
  }),
  fontStyle: (light: string, dark: string) => ({
    fontStyle: {
      default: light,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: dark,
    },
  }),
  fontWeight: (light: string, dark: string) => ({
    fontWeight: {
      default: light,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: dark,
    },
  }),
  decoration: (light: string, dark: string) => ({
    textDecorationLine: {
      default: light,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: dark,
    },
  }),
})

const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine({ forgiving: true }),
  langs: [
    css,
    diff,
    html,
    javascript,
    json,
    jsx,
    markdown,
    python,
    shellscript,
    sql,
    tsx,
    typescript,
    yaml,
  ],
  themes: [githubLight, githubDark],
})

const languages = new Map(
  Object.entries({
    ansi: "ansi",
    bash: "shellscript",
    css: "css",
    diff: "diff",
    html: "html",
    javascript: "javascript",
    json: "json",
    jsx: "jsx",
    markdown: "markdown",
    python: "python",
    sql: "sql",
    tsx: "tsx",
    typescript: "typescript",
    yaml: "yaml",
    js: "javascript",
    md: "markdown",
    py: "python",
    sh: "shellscript",
    shell: "shellscript",
    shellscript: "shellscript",
    ts: "typescript",
    yml: "yaml",
    zsh: "shellscript",
  }),
)

export function loadHighlighter(language: string) {
  const lang = languages.get(language.toLowerCase())

  if (!lang) return null

  return {
    highlight(code: string, state?: GrammarState) {
      function tokenize(text: string) {
        return highlighter.codeToTokens(text, {
          lang,
          themes: { light: "github-light-high-contrast", dark: "github-dark" },
          defaultColor: false,
          grammarState: state,
        }).tokens
      }

      const tokens =
        lang === "ansi" ? code.split("\n").flatMap(tokenize) : tokenize(code)

      return {
        lines: tokens.map((line) =>
          line.map((token, index) => {
            const light = String(token.htmlStyle?.["--shiki-light"] ?? "")
            const dark = String(token.htmlStyle?.["--shiki-dark"] ?? "")

            const validColor =
              /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i

            const color =
              validColor.test(light) && validColor.test(dark)
                ? `light-dark(${light}, ${dark})`
                : "inherit"

            const lightBackground = String(
              token.htmlStyle?.["--shiki-light-bg"] ?? "",
            )

            const darkBackground = String(
              token.htmlStyle?.["--shiki-dark-bg"] ?? "",
            )

            const background =
              validColor.test(lightBackground) &&
              validColor.test(darkBackground)
                ? `light-dark(${lightBackground}, ${darkBackground})`
                : "transparent"

            return (
              <span
                key={`${index}:${token.offset}`}
                {...stylex.props(
                  styles.token(color, background),
                  styles.fontStyle(
                    String(
                      token.htmlStyle?.["--shiki-light-font-style"] ??
                        "inherit",
                    ),
                    String(
                      token.htmlStyle?.["--shiki-dark-font-style"] ?? "inherit",
                    ),
                  ),
                  styles.fontWeight(
                    String(
                      token.htmlStyle?.["--shiki-light-font-weight"] ??
                        "inherit",
                    ),
                    String(
                      token.htmlStyle?.["--shiki-dark-font-weight"] ??
                        "inherit",
                    ),
                  ),
                  styles.decoration(
                    String(
                      token.htmlStyle?.["--shiki-light-text-decoration"] ??
                        "inherit",
                    ),
                    String(
                      token.htmlStyle?.["--shiki-dark-text-decoration"] ??
                        "inherit",
                    ),
                  ),
                )}
              >
                {token.content}
              </span>
            )
          }),
        ),
        state: highlighter.getLastGrammarState(tokens),
      }
    },
  }
}

export function highlightCode(code: string, language: string) {
  return loadHighlighter(language)?.highlight(code).lines ?? null
}

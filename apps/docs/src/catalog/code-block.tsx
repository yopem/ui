import { ScrollArea } from "@registry/components/ui/scroll-area"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import astro from "@shikijs/langs/astro"
import css from "@shikijs/langs/css"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import shellscript from "@shikijs/langs/shellscript"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"
import { createHighlighterCoreSync } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

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

function highlightCode(code: string, title: string) {
  return highlighter.codeToHtml(code, {
    defaultColor: "light-dark()",
    lang: getCodeLanguage(title),
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

export function CopyableCode({
  code,
  title = "Code",
}: {
  code: string
  title?: string
}) {
  const hydrated = useHydrated()
  const { copyToClipboard, copyError, isCopied } = useCopyToClipboard()
  const highlightedCode = highlightCode(code, title)
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.header)}>
        <code {...stylex.props(styles.title)}>{title}</code>
        <button
          {...stylex.props(styles.copy, styles.focus)}
          type="button"
          disabled={!hydrated}
          aria-label={`Copy ${title}`}
          onClick={() => void copyToClipboard(code)}
        >
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <ScrollArea
        {...stylex.props(styles.pre, styles.code)}
        aria-label={title}
        clampContentMinWidth={false}
        overscrollContain
      >
        <div
          {...stylex.props(styles.codeContent)}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </ScrollArea>
      <output
        {...stylex.props(styles.status, Boolean(copyError) && styles.error)}
      >
        {copyError ?? (isCopied ? "Copied to clipboard." : "")}
      </output>
    </div>
  )
}

const styles = stylex.create({
  root: {
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
    marginBlock: "1.5rem",
    minInlineSize: 0,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    paddingBlock: "0.65rem",
    paddingInline: "1rem",
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
    fontSize: "0.75rem",
  },
  title: { fontFamily: tokens["--font-mono"], overflowWrap: "anywhere" },
  copy: {
    backgroundColor: {
      default: tokens["--background"],
      ":hover": tokens["--accent"],
    },
    color: tokens["--foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-sm"],
    paddingBlock: "0.4rem",
    paddingInline: "0.65rem",
    minBlockSize: "2rem",
    flexShrink: 0,
    font: "inherit",
    cursor: { default: "pointer", ":disabled": "wait" },
    opacity: { default: 1, ":disabled": 0.5 },
  },
  focus: {
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: -2,
    },
  },
  pre: {
    margin: 0,
    maxBlockSize: "36rem",
    fontSize: "0.8125rem",
    lineHeight: 1.65,
    tabSize: 2,
    whiteSpace: "pre",
  },
  codeContent: {
    inlineSize: "max-content",
    minInlineSize: "100%",
    padding: "1rem",
  },
  code: {
    colorScheme: {
      default: "light",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]: "dark",
    },
    fontFamily: tokens["--font-mono"],
  },
  status: {
    display: "block",
    paddingInline: "1rem",
    fontSize: "0.8125rem",
    overflowWrap: "anywhere",
  },
  error: { color: tokens["--destructive"] },
})

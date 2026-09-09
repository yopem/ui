import type { ComponentProps } from "react"

import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

// Only overflowing regions need a tab stop. Observe content too: details and
// lazy demos can change scroll dimensions without resizing the viewport.
export function KeyboardScrollArea({
  children,
  ...props
}: Omit<ComponentProps<"section">, "style" | "tabIndex" | "ref">) {
  return (
    <section
      {...props}
      ref={(element) => {
        if (!element) return
        const updateTabStop = () => {
          element.tabIndex =
            element.scrollHeight > element.clientHeight ||
            element.scrollWidth > element.clientWidth
              ? 0
              : -1
        }
        const observer = new ResizeObserver(updateTabStop)
        observer.observe(element)
        for (const child of element.children) observer.observe(child)
        updateTabStop()
        return () => observer.disconnect()
      }}
    >
      {children}
    </section>
  )
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
      <KeyboardScrollArea
        {...stylex.props(styles.pre, styles.focus)}
        aria-label={title}
      >
        <pre {...stylex.props(styles.text)}>
          <code {...stylex.props(styles.code)}>{code}</code>
        </pre>
      </KeyboardScrollArea>
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
    padding: "1rem",
    overflow: "auto",
    maxBlockSize: "36rem",
    fontSize: "0.8125rem",
    lineHeight: 1.65,
    tabSize: 2,
    whiteSpace: "pre",
  },
  text: { margin: 0, font: "inherit" },
  code: { fontFamily: tokens["--font-mono"] },
  status: {
    display: "block",
    paddingInline: "1rem",
    fontSize: "0.8125rem",
    overflowWrap: "anywhere",
  },
  error: { color: tokens["--destructive"] },
})

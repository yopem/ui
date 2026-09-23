import { ScrollArea } from "@registry/components/ui/scroll-area"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"
import { CheckIcon, CopyIcon } from "lucide-react"
import { lazy, Suspense, useState } from "react"

import { stripStandaloneComments } from "@/catalog/source-code"
import { Box } from "@/components/ui/box"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
const HighlightedCode = lazy(() =>
  import("./highlighted-code").then((module) => ({
    default: module.HighlightedCode,
  })),
)

export function CopyableCode({
  code,
  header,
  preview = false,
  title = "Code",
}: {
  code: string
  header?: string
  preview?: boolean
  title?: string
}) {
  const hydrated = useHydrated()
  const cleanCode = stripStandaloneComments(code)
  const codeLines = cleanCode.trimEnd().split("\n")
  const collapsible = preview && codeLines.length > 5
  const [expanded, setExpanded] = useState(!preview)
  const visibleCode =
    collapsible && !expanded ? codeLines.slice(0, 5).join("\n") : cleanCode
  const { copyToClipboard, copyError, isCopied } = useCopyToClipboard()
  return (
    <Box {...stylex.props(styles.root, previewRoot(preview, header))}>
      <CodeBlockControls
        header={header}
        hydrated={hydrated}
        isCopied={isCopied}
        title={title}
        onCopy={() => void copyToClipboard(cleanCode)}
      />
      <ScrollArea
        {...stylex.props(
          styles.pre,
          styles.code,
          collapsible && !expanded && styles.preview,
        )}
        aria-label={title}
        clampContentMinWidth={false}
        overscrollContain
      >
        <Suspense
          fallback={
            <Box {...stylex.props(styles.codeContent)}>
              <Box as="code">{visibleCode}</Box>
            </Box>
          }
        >
          <HighlightedCode
            {...stylex.props(styles.codeContent)}
            code={visibleCode}
            title={title}
          />
        </Suspense>
      </ScrollArea>
      {collapsible && !expanded ? (
        <Box
          as="button"
          {...stylex.props(styles.expand, styles.focus)}
          type="button"
          onClick={() => setExpanded(true)}
        >
          View code
        </Box>
      ) : null}
      <Box
        as="output"
        {...stylex.props(styles.status, Boolean(copyError) && styles.error)}
      >
        {copyError ?? ""}
      </Box>
    </Box>
  )
}

function previewRoot(preview: boolean, header?: string) {
  return preview && !header ? styles.previewRoot : undefined
}

function CodeBlockControls({
  header,
  hydrated,
  isCopied,
  onCopy,
  title,
}: {
  header?: string
  hydrated: boolean
  isCopied: boolean
  onCopy: () => void
  title: string
}) {
  return (
    <Box {...stylex.props(Boolean(header) && styles.header)}>
      {header ? (
        <Box as="code" {...stylex.props(styles.headerTitle)}>
          {header}
        </Box>
      ) : null}
      <Box
        as="button"
        {...stylex.props(
          styles.copy,
          Boolean(header) && styles.headerCopy,
          styles.focus,
        )}
        type="button"
        disabled={!hydrated}
        aria-label={isCopied ? `${title} copied` : `Copy ${title}`}
        onClick={onCopy}
      >
        {isCopied ? (
          <CheckIcon
            {...stylex.props(styles.icon, styles.copiedIcon)}
            aria-hidden="true"
          />
        ) : (
          <CopyIcon {...stylex.props(styles.icon)} aria-hidden="true" />
        )}
      </Box>
    </Box>
  )
}

const copied = stylex.keyframes({
  from: { opacity: 0.5, transform: "scale(0.9)" },
  to: { opacity: 1, transform: "scale(1)" },
})

const copiedReduced = stylex.keyframes({
  from: { opacity: 0.5 },
  to: { opacity: 1 },
})

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
    position: "relative",
  },
  previewRoot: {
    borderStartStartRadius: 0,
    borderStartEndRadius: 0,
    marginBlockStart: -1,
  },
  header: {
    alignItems: "center",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
  },
  headerTitle: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.8125rem",
    fontWeight: 600,
    overflowWrap: "anywhere",
  },
  headerCopy: { flexShrink: 0, position: "static" },
  preview: {
    maxBlockSize: "9rem",
    maskImage: "linear-gradient(to bottom, black 45%, transparent 100%)",
    overflow: "hidden",
  },
  expand: {
    backgroundColor: tokens["--accent"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-sm"],
    color: tokens["--accent-foreground"],
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 600,
    insetBlockEnd: "0.75rem",
    insetInlineStart: "50%",
    paddingBlock: "0.375rem",
    paddingInline: "0.625rem",
    position: "absolute",
    transform: "translateX(-50%)",
    zIndex: 1,
  },
  copy: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      ":hover": tokens["--accent"],
    },
    blockSize: "2rem",
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-sm"],
    color: tokens["--foreground"],
    cursor: { default: "pointer", ":disabled": "wait" },
    display: "flex",
    inlineSize: "2rem",
    insetBlockStart: "0.75rem",
    insetInlineEnd: "0.75rem",
    justifyContent: "center",
    opacity: { default: 1, ":disabled": 0.5 },
    padding: 0,
    position: "absolute",
    zIndex: 1,
  },
  icon: { blockSize: "1rem", inlineSize: "1rem" },
  copiedIcon: {
    animation: {
      default: `${copied} 150ms cubic-bezier(0.23, 1, 0.32, 1)`,
      "@media (prefers-reduced-motion: reduce)": `${copiedReduced} 150ms cubic-bezier(0.23, 1, 0.32, 1)`,
    },
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
    paddingBlock: "1rem",
    paddingInlineStart: "1rem",
    paddingInlineEnd: "3.5rem",
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

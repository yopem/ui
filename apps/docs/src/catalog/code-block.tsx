import { Box } from "@registry/components/ui/box"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"
import { CheckIcon, CopyIcon } from "lucide-react"
import { lazy, Suspense, useState } from "react"

import { stripStandaloneComments } from "@/catalog/source-code"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"

const primitiveStyles = stylex.create({
  box: {
    inlineSize: "max-content",
    minInlineSize: "100%",
    paddingBlock: "1rem",
    paddingInlineStart: "1rem",
    paddingInlineEnd: "3.5rem",
  },
  scrollArea: {
    margin: "calc(var(--spacing) * 0)",
    maxBlockSize: "9rem",
    fontSize: "0.8125rem",
    lineHeight: 1.65,
    tabSize: 2,
    whiteSpace: "pre",
    fontFamily: tokens["--font-mono"],
    maskImage: "linear-gradient(to bottom, black 45%, transparent 100%)",
    overflow: "hidden",
  },
  scrollArea2: {
    margin: "calc(var(--spacing) * 0)",
    maxBlockSize: "36rem",
    fontSize: "0.8125rem",
    lineHeight: 1.65,
    tabSize: 2,
    whiteSpace: "pre",
    fontFamily: tokens["--font-mono"],
  },
  button: {
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
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": -2 },
  },
  output: {
    display: "block",
    paddingInline: "1rem",
    fontSize: "0.8125rem",
    overflowWrap: "anywhere",
  },
  span: { color: tokens["--destructive"] },
  box2: {
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
    marginBlock: "1.5rem",
    minInlineSize: "calc(var(--spacing) * 0)",
    overflow: "hidden",
    position: "relative",
    borderStartStartRadius: 0,
    borderStartEndRadius: 0,
    marginBlockStart: "calc(var(--spacing) * -1)",
  },
  box3: {
    backgroundColor: tokens["--code"],
    color: tokens["--code-foreground"],
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-lg"],
    marginBlock: "1.5rem",
    minInlineSize: "calc(var(--spacing) * 0)",
    overflow: "hidden",
    position: "relative",
  },
  button2: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        tokens["--accent"],
    },
    blockSize: "2rem",
    borderColor: tokens["--border"],
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: tokens["--radius-sm"],
    color: tokens["--foreground"],
    cursor: {
      default: "pointer",
      ":is(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        "wait",
    },
    opacity: {
      ":is(:disabled, [disabled], [aria-disabled=true], [data-disabled])": 0.5,
      default: 1,
    },
    display: "flex",
    inlineSize: "2rem",
    insetBlockStart: "0.75rem",
    insetInlineEnd: "0.75rem",
    justifyContent: "center",
    paddingBlock: "calc(var(--spacing) * 0)",
    paddingInline: "calc(var(--spacing) * 0)",
    position: "absolute",
    zIndex: 1,
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": -2 },
  },
  box4: {
    alignItems: "center",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    paddingInlineEnd: "3.5rem",
  },
  code: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.8125rem",
    fontWeight: 600,
    overflowWrap: "anywhere",
  },
})

const HighlightedCode = lazy(() =>
  import("./highlighted-code").then((module) => ({
    default: module.HighlightedCode,
  })),
)

export function CopyableCode({
  code,
  header,
  language,
  preview = false,
  title = "Code",
}: {
  code: string
  header?: string
  language?: string
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

  const codeContent = (
    <Suspense
      fallback={
        <Box xstyle={primitiveStyles.box}>
          <Box as="code">{visibleCode}</Box>
        </Box>
      }
    >
      <HighlightedCode
        {...stylex.props(styles.codeContent)}
        code={visibleCode}
        language={language}
        title={title}
      />
    </Suspense>
  )

  const scrollArea =
    collapsible && !expanded ? (
      <ScrollArea
        xstyle={primitiveStyles.scrollArea}
        aria-label={title}
        clampContentMinWidth={false}
        overscrollContain
      >
        {codeContent}
      </ScrollArea>
    ) : (
      <ScrollArea
        xstyle={primitiveStyles.scrollArea2}
        aria-label={title}
        clampContentMinWidth={false}
        overscrollContain
      >
        {codeContent}
      </ScrollArea>
    )

  const handleCopy = useEventCallback(function () {
    return void copyToClipboard(cleanCode)
  })

  const handleClick = useEventCallback(function () {
    return setExpanded(true)
  })

  const contents = (
    <>
      <CodeBlockControls
        header={header}
        hydrated={hydrated}
        isCopied={isCopied}
        title={title}
        onCopy={handleCopy}
      />
      {scrollArea}
      {collapsible && !expanded ? (
        <Box
          as="button"
          xstyle={primitiveStyles.button}
          type="button"
          onClick={handleClick}
        >
          View code
        </Box>
      ) : null}
      <Box as="output" xstyle={primitiveStyles.output}>
        {copyError ? (
          <Box as="span" xstyle={primitiveStyles.span}>
            {copyError}
          </Box>
        ) : null}
      </Box>
    </>
  )

  if (preview && !header) {
    return <Box xstyle={primitiveStyles.box2}>{contents}</Box>
  }

  return <Box xstyle={primitiveStyles.box3}>{contents}</Box>
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
  const button = (
    <Box
      as="button"
      xstyle={primitiveStyles.button2}
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
  )

  return header ? (
    <Box xstyle={primitiveStyles.box4}>
      <Box as="code" xstyle={primitiveStyles.code}>
        {header}
      </Box>
      {button}
    </Box>
  ) : (
    button
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
  icon: { blockSize: "1rem", inlineSize: "1rem" },
  copiedIcon: {
    animation: {
      default: `${copied} 150ms cubic-bezier(0.23, 1, 0.32, 1)`,
      "@media (prefers-reduced-motion: reduce)": `${copiedReduced} 150ms cubic-bezier(0.23, 1, 0.32, 1)`,
    },
  },
  codeContent: {
    inlineSize: "max-content",
    minInlineSize: "100%",
    paddingBlock: "1rem",
    paddingInlineStart: "1rem",
    paddingInlineEnd: "3.5rem",
  },
})

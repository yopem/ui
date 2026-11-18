"use client"

import type { ButtonProps } from "@registry/components/ui/button"
import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps, MouseEvent, ReactNode } from "react"

import { Button } from "@registry/components/ui/button"
import { Pre } from "@registry/components/ui/pre"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { isString, mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

const SizeContext = createContext<"default" | "sm">("default")

const VariantContext = createContext<"default" | "destructive">("default")

const HeaderContext = createContext(false)

const NumberedContext = createContext(false)

const styles = stylex.create({
  root: {
    backgroundColor: tokens["--code"],
    borderColor: tokens["--card-border"],
    borderRadius: tokens["--radius"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--code-foreground"],
    display: "flex",
    flexDirection: "column",
    fontSize: "0.875rem",
    inlineSize: "100%",
    minInlineSize: 0,
    overflow: "hidden",
    position: "relative",
  },
  destructive: {
    borderColor: tokens["--destructive"],
    color: tokens["--destructive-foreground"],
  },
  compact: { fontSize: "0.75rem" },
  header: {
    alignItems: "center",
    color: tokens["--muted-foreground"],
    display: "flex",
    flexShrink: 0,
    gap: "calc(2 * " + tokens["--spacing"] + ")",
    minInlineSize: 0,
    paddingBlockStart: "calc(3 * " + tokens["--spacing"] + ")",
    paddingInline: "calc(3 * " + tokens["--spacing"] + ")",
  },
  headerCompact: {
    paddingBlockStart: `calc(2.5 * ${tokens["--spacing"]})`,
    paddingInline: `calc(2.5 * ${tokens["--spacing"]})`,
  },
  footerCompact: {
    paddingBlockEnd: `calc(2.5 * ${tokens["--spacing"]})`,
    paddingInline: `calc(2.5 * ${tokens["--spacing"]})`,
  },
  title: {
    color: tokens["--code-foreground"],
    fontFamily: tokens["--font-sans"],
    fontSize: "inherit",
    fontWeight: 500,
    minInlineSize: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  destructiveText: { color: tokens["--destructive-foreground"] },
  actions: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    gap: tokens["--spacing"],
    marginInlineStart: "auto",
  },
  floating: {
    opacity: {
      default: 0,
      [stylex.when.ancestor(
        ':is([data-slot="codeblock"]:hover, [data-slot="codeblock"]:focus-within)',
      )]: 1,
      "@media (pointer: coarse)": 1,
    },
    transitionProperty: "opacity",
    transitionDuration: {
      default: "150ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
    transitionTimingFunction: "ease-out",
    insetBlockStart: "calc(2 * " + tokens["--spacing"] + ")",
    insetInlineEnd: "calc(2 * " + tokens["--spacing"] + ")",
    position: "absolute",
    zIndex: 1,
  },
  floatingButton: { backgroundColor: tokens["--code"] },
  status: {
    blockSize: 1,
    clipPath: "inset(50%)",
    inlineSize: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
  },
  pre: {
    color: "inherit",
    fontSize: "inherit",
    minBlockSize: 0,
    overflow: "auto",
    padding: "calc(3 * " + tokens["--spacing"] + ")",
    tabSize: 2,
    textAlign: "start",
    whiteSpace: "pre",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: -2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  preCompact: { padding: "calc(2.5 * " + tokens["--spacing"] + ")" },
  wrap: { overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
  counter: (startLine: number) => ({ counterReset: `line ${startLine - 1}` }),
  code: {
    display: "grid",
    fontFamily: "inherit",
    fontSize: "inherit",
    minInlineSize: "max-content",
  },
  codeWrap: { minInlineSize: 0 },
  numberedCode: { gridTemplateColumns: "auto 1fr" },
  line: {
    display: "block",
    minBlockSize: "1lh",
    position: "relative",
  },
  numberedLine: {
    columnGap: "calc(3 * " + tokens["--spacing"] + ")",
    counterIncrement: "line",
    display: "grid",
    gridColumn: "1 / -1",
    gridTemplateColumns: "subgrid",
    "::before": {
      color: tokens["--muted-foreground"],
      content: 'counter(line) / ""',
      minInlineSize: "3ch",
      textAlign: "end",
      userSelect: "none",
    },
  },
  lineContent: { minInlineSize: 0 },
  added: {
    backgroundColor: tokens["--code-highlight"],
  },
  removed: {
    backgroundColor: tokens["--code-highlight"],
    color: tokens["--destructive-foreground"],
  },
  highlighted: { backgroundColor: tokens["--code-highlight"] },
  diffContent: {
    display: "block",
    paddingInlineStart: "2ch",
    position: "relative",
    "::before": {
      insetInlineStart: 0,
      insetBlockStart: 0,
      position: "absolute",
      userSelect: "none",
    },
  },
  addedContent: {
    "::before": { content: '"+"', color: tokens["--muted-foreground"] },
  },
  removedContent: { "::before": { content: '"−"' } },
  footer: {
    alignItems: "center",
    color: tokens["--muted-foreground"],
    display: "flex",
    flexShrink: 0,
    gap: "calc(2 * " + tokens["--spacing"] + ")",
    paddingBlockEnd: "calc(3 * " + tokens["--spacing"] + ")",
    paddingInline: "calc(3 * " + tokens["--spacing"] + ")",
  },
})

function hasCodeblockParts(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return false

    return child.type === Fragment
      ? hasCodeblockParts(child.props.children)
      : child.type === CodeblockHeader ||
          child.type === CodeblockActions ||
          child.type === CodeblockContent ||
          child.type === CodeblockFooter
  })
}

export type CodeblockProps = StyleXComponentProps<
  ComponentProps<"div">,
  {
    size?: "default" | "sm"
    variant?: "default" | "destructive"
  }
>

export function Codeblock({
  xstyle,
  className,
  children,
  size = "default",
  variant = "default",
  ...props
}: CodeblockProps) {
  const codeRef = useRef<HTMLPreElement>(null)

  const composed = hasCodeblockParts(children)

  return (
    <SizeContext value={size}>
      <VariantContext value={variant}>
        <div
          data-slot="codeblock"
          data-size={size}
          data-variant={variant}
          {...mergeStylexProps(
            stylexProps(
              className,
              stylex.defaultMarker(),
              styles.root,
              size === "sm" && styles.compact,
              variant === "destructive" && styles.destructive,
              xstyle,
            ),
            props,
          )}
        >
          {composed ? (
            children
          ) : (
            <>
              <CodeblockHeader>
                <CodeblockActions>
                  <CodeblockCopyControl codeRef={codeRef}>
                    Copy code
                  </CodeblockCopyControl>
                </CodeblockActions>
              </CodeblockHeader>
              <CodeblockContent ref={codeRef}>{children}</CodeblockContent>
            </>
          )}
        </div>
      </VariantContext>
    </SizeContext>
  )
}

export type CodeblockHeaderProps = StyleXComponentProps<ComponentProps<"div">>

export function CodeblockHeader({
  xstyle,
  className,
  ...props
}: CodeblockHeaderProps) {
  const variant = useContext(VariantContext)
  const size = useContext(SizeContext)

  return (
    <HeaderContext value={true}>
      <div
        data-slot="codeblock-toolbar"
        {...mergeStylexProps(
          stylexProps(
            className,
            styles.header,
            size === "sm" && styles.headerCompact,
            variant === "destructive" && styles.destructiveText,
            xstyle,
          ),
          props,
        )}
      />
    </HeaderContext>
  )
}

export type CodeblockTitleProps = StyleXComponentProps<ComponentProps<"div">>

export function CodeblockTitle({
  xstyle,
  className,
  ...props
}: CodeblockTitleProps) {
  const variant = useContext(VariantContext)

  return (
    <div
      data-slot="codeblock-title"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.title,
          variant === "destructive" && styles.destructiveText,
          xstyle,
        ),
        props,
      )}
    />
  )
}

export type CodeblockActionsProps = StyleXComponentProps<ComponentProps<"div">>

export function CodeblockActions({
  xstyle,
  className,
  ...props
}: CodeblockActionsProps) {
  const inHeader = useContext(HeaderContext)

  return (
    <div
      data-slot="codeblock-actions"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.actions,
          !inHeader && styles.floating,
          xstyle,
        ),
        props,
      )}
    />
  )
}

export type CodeblockCopyButtonProps = ButtonProps & { value: string }

type CopyButtonProps = Omit<CodeblockCopyButtonProps, "value"> & {
  value?: string
  codeRef?: { current: HTMLPreElement | null }
}

export function CodeblockCopyButton(props: CodeblockCopyButtonProps) {
  return <CodeblockCopyControl {...props} />
}

function CodeblockCopyControl({
  value,
  codeRef,
  children,
  onClick,
  variant = "ghost",
  size = children ? "xs" : "icon-xs",
  xstyle,
  "aria-label": ariaLabel = "Copy code",
  ...props
}: CopyButtonProps) {
  const [status, setStatus] = useState<"copied" | "error" | null>(null)
  const inHeader = useContext(HeaderContext)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(
    () => () => {
      if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current)
    },
    [],
  )

  const copyCode = useEventCallback(async () => {
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current)

    setStatus(null)

    try {
      await navigator.clipboard.writeText(
        value ?? codeRef?.current?.textContent ?? "",
      )
      setStatus("copied")
    } catch {
      setStatus("error")
    }

    feedbackTimer.current = setTimeout(() => setStatus(null), 2000)
  })

  const handleClick = useEventCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)

      if (!event.defaultPrevented) void copyCode()
    },
  )

  return (
    <>
      <Button
        data-slot="codeblock-copy"
        data-copied={status === "copied" || undefined}
        aria-label={ariaLabel}
        variant={variant}
        size={size}
        xstyle={[!inHeader && styles.floatingButton, xstyle]}
        onClick={handleClick}
        {...props}
      >
        {children ??
          (status === "copied" ? (
            <CheckIcon aria-hidden="true" size={14} />
          ) : (
            <CopyIcon aria-hidden="true" size={14} />
          ))}
      </Button>
      <output
        data-slot="codeblock-status"
        aria-live="polite"
        aria-atomic="true"
        {...stylex.props(styles.status)}
      >
        {status === "copied"
          ? "Code copied."
          : status === "error"
            ? "Could not copy. Select the code and copy it manually."
            : ""}
      </output>
    </>
  )
}

export type CodeblockContentProps = StyleXComponentProps<
  ComponentProps<"pre">,
  {
    wrap?: boolean
    lineNumbers?: boolean
    startLine?: number
  }
>

export function CodeblockContent({
  xstyle,
  className,
  children,
  wrap = false,
  lineNumbers = false,
  startLine = 1,
  ...props
}: CodeblockContentProps) {
  const size = useContext(SizeContext)
  const firstLine = Number.isFinite(startLine) ? Math.trunc(startLine) : 1

  const source = isString(children) ? children : null

  return (
    <NumberedContext value={lineNumbers}>
      <Pre
        data-slot="codeblock-pre"
        data-wrap={wrap || undefined}
        data-numbered={lineNumbers || undefined}
        dir="ltr"
        tabIndex={0}
        className={className}
        xstyle={[
          styles.pre,
          size === "sm" && styles.preCompact,
          wrap && styles.wrap,
          styles.counter(firstLine),
          xstyle,
        ]}
        {...props}
      >
        <code
          data-slot="codeblock-code"
          {...stylex.props(
            styles.code,
            wrap && styles.codeWrap,
            lineNumbers && styles.numberedCode,
          )}
        >
          {lineNumbers && source !== null
            ? source
                .replace(/\n$/, "")
                .split("\n")
                .map((line, index) => (
                  <CodeblockLine key={`${firstLine + index}:${line}`}>
                    {line}
                  </CodeblockLine>
                ))
            : children}
        </code>
      </Pre>
    </NumberedContext>
  )
}

export type CodeblockLineProps = StyleXComponentProps<
  ComponentProps<"span">,
  {
    variant?: "default" | "added" | "removed" | "highlighted"
  }
>

export function CodeblockLine({
  xstyle,
  className,
  children,
  variant = "default",
  ...props
}: CodeblockLineProps) {
  const numbered = useContext(NumberedContext)

  const empty =
    children === undefined ||
    children === null ||
    children === "" ||
    (Array.isArray(children) && children.length === 0)

  return (
    <span
      data-slot="codeblock-line"
      data-variant={variant}
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.line,
          numbered && styles.numberedLine,
          variant !== "default" && styles[variant],
          xstyle,
        ),
        props,
      )}
    >
      <span
        data-slot="codeblock-line-content"
        {...stylex.props(
          styles.lineContent,
          (variant === "added" || variant === "removed") && styles.diffContent,
          variant === "added" && styles.addedContent,
          variant === "removed" && styles.removedContent,
        )}
      >
        {empty ? "\n" : children}
      </span>
    </span>
  )
}

export type CodeblockFooterProps = StyleXComponentProps<ComponentProps<"div">>

export function CodeblockFooter({
  xstyle,
  className,
  ...props
}: CodeblockFooterProps) {
  const variant = useContext(VariantContext)
  const size = useContext(SizeContext)

  return (
    <div
      data-slot="codeblock-footer"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.footer,
          size === "sm" && styles.footerCompact,
          variant === "destructive" && styles.destructiveText,
          xstyle,
        ),
        props,
      )}
    />
  )
}

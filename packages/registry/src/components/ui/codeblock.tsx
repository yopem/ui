"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useRef, useState } from "react"

const styles = stylex.create({
  root: {
    backgroundColor: tokens["--code"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--code-foreground"],
    minInlineSize: 0,
    overflow: "hidden",
  },
  toolbar: {
    alignItems: "center",
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
  },
  button: {
    backgroundColor: "transparent",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-sm"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    cursor: "pointer",
    fontFamily: tokens["--font-sans"],
    fontSize: "0.875rem",
    minBlockSize: "2.75rem",
    paddingInline: "0.75rem",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  status: {
    color: tokens["--muted-foreground"],
    fontSize: "0.8125rem",
  },
  pre: {
    margin: 0,
    overflowX: "auto",
    paddingBlock: "1rem",
    paddingInline: "1rem",
    whiteSpace: "pre",
  },
  code: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.875rem",
    tabSize: 2,
  },
})

export type CodeblockProps = StyleXComponentProps<ComponentProps<"div">>

export function Codeblock({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: CodeblockProps) {
  const codeRef = useRef<HTMLPreElement>(null)
  const [copyStatus, setCopyStatus] = useState<"copied" | "error" | null>(null)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeRef.current?.textContent ?? "")
      setCopyStatus("copied")
    } catch {
      setCopyStatus("error")
    }
  }

  return (
    <div
      data-slot="codeblock"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        restProps,
      )}
    >
      <div data-slot="codeblock-toolbar" {...stylex.props(styles.toolbar)}>
        <button
          data-slot="codeblock-copy"
          type="button"
          onClick={copyCode}
          {...stylex.props(styles.button)}
        >
          Copy code
        </button>
        {copyStatus ? (
          <output
            data-slot="codeblock-status"
            aria-live="polite"
            {...stylex.props(styles.status)}
          >
            {copyStatus === "copied"
              ? "Code copied."
              : "Could not copy. Select the code and copy it manually."}
          </output>
        ) : null}
      </div>
      <pre
        ref={codeRef}
        data-slot="codeblock-pre"
        {...stylex.props(styles.pre)}
      >
        <code data-slot="codeblock-code" {...stylex.props(styles.code)}>
          {children}
        </code>
      </pre>
    </div>
  )
}

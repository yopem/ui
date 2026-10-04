"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef, MouseEvent } from "react"

import { useEventCallback } from "@registry/hooks/use-event-callback"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

const styles = stylex.create({
  button: {
    alignItems: "center",
    backgroundColor: tokens["--secondary"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--secondary-foreground"],
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    fontWeight: 500,
    gap: "0.5rem",
    justifyContent: "center",
    minBlockSize: "2.25rem",
    minInlineSize: "2.25rem",
    opacity: { default: 1, ":disabled": 0.64 },
    paddingInline: "0.75rem",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    "@media (pointer: coarse)": { minBlockSize: "2.75rem" },
  },
  status: {
    blockSize: 1,
    clipPath: "inset(50%)",
    inlineSize: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
  },
})

export type ClipboardProps = StyleXComponentProps<
  ComponentPropsWithRef<"button">,
  { value: string }
>

export function Clipboard({
  xstyle: consumerXstyle,
  className,
  value,
  children,
  onClick,
  type = "button",
  "aria-label": ariaLabel = "Copy to clipboard",
  ...props
}: ClipboardProps) {
  const [status, setStatus] = useState<"pending" | "success" | "error" | null>(
    null,
  )

  const copyToClipboard = useEventCallback(async function () {
    setStatus("pending")

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        setStatus("error")

        return
      }

      await navigator.clipboard.writeText(value)
      setStatus("success")
    } catch {
      setStatus("error")
    }
  })

  const handleClick = useEventCallback(function (
    event: MouseEvent<HTMLButtonElement>,
  ) {
    onClick?.(event)

    if (!event.defaultPrevented) void copyToClipboard()
  })

  return (
    <>
      <button
        aria-label={ariaLabel}
        data-slot="clipboard"
        onClick={handleClick}
        type={type}
        {...mergeStylexProps(
          stylexProps(className, styles.button, consumerXstyle),
          props,
        )}
      >
        {status === "pending"
          ? "Copying…"
          : status === "success"
            ? "Copied"
            : status === "error"
              ? "Copy failed"
              : (children ?? "Copy")}
      </button>
      <output
        aria-atomic="true"
        aria-live="polite"
        data-slot="clipboard-status"
        {...stylex.props(styles.status)}
      >
        {status === "pending"
          ? "Copying to clipboard"
          : status === "success"
            ? "Copied to clipboard"
            : status === "error"
              ? "Could not copy to clipboard"
              : ""}
      </output>
    </>
  )
}

"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react"

import { useEventCallback } from "@registry/hooks/use-event-callback"
import { isString, mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  HourglassIcon,
} from "lucide-react"
import { Fragment, isValidElement, useState } from "react"

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
    "@media (pointer: coarse)": {
      minBlockSize: "2.75rem",
      minInlineSize: "2.75rem",
    },
  },
  icon: {
    blockSize: "1rem",
    flexShrink: 0,
    inlineSize: "1rem",
  },
  errorStatus: {
    color: tokens["--destructive-foreground"],
    fontSize: "0.875rem",
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

function hasOnlyEmptyChildren(children: ReactNode): boolean {
  if (children == null || children === false || children === true) return true

  if (isString(children)) return children.trim() === ""

  if (Array.isArray(children)) return children.every(hasOnlyEmptyChildren)

  if (
    isValidElement<{ children?: ReactNode }>(children) &&
    children.type === Fragment
  ) {
    return hasOnlyEmptyChildren(children.props.children)
  }

  return false
}

function defaultClipboardText(ariaLabel: string | undefined) {
  return ariaLabel?.trim() && !ariaLabel.toLowerCase().includes("copy")
    ? ariaLabel
    : "Copy"
}

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
  title = "Copy to clipboard",
  "aria-label": ariaLabel,
  ...props
}: ClipboardProps) {
  const [status, setStatus] = useState<"pending" | "success" | "error" | null>(
    null,
  )

  const StatusIcon =
    status === "pending"
      ? HourglassIcon
      : status === "success"
        ? CheckIcon
        : status === "error"
          ? CircleAlertIcon
          : CopyIcon

  const copyToClipboard = useEventCallback(async () => {
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

  const handleClick = useEventCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)

      if (!event.defaultPrevented) void copyToClipboard()
    },
  )

  return (
    <>
      <button
        aria-label={
          ariaLabel ??
          (props["aria-labelledby"] == null && hasOnlyEmptyChildren(children)
            ? "Copy to clipboard"
            : undefined)
        }
        data-slot="clipboard"
        onClick={handleClick}
        title={title}
        type={type}
        {...mergeStylexProps(
          stylexProps(className, styles.button, consumerXstyle),
          props,
        )}
      >
        <StatusIcon
          aria-hidden="true"
          data-slot="clipboard-icon"
          {...stylex.props(styles.icon)}
        />
        {children ?? defaultClipboardText(ariaLabel)}
      </button>
      <output
        aria-atomic="true"
        aria-live="polite"
        data-slot="clipboard-status"
        {...stylex.props(
          status === "error" ? styles.errorStatus : styles.status,
        )}
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

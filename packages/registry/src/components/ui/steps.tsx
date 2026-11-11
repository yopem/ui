import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    counterReset: "step",
    listStyleType: "decimal",
    marginBlock: 0,
    paddingInlineStart: 0,
  },
  item: {
    color: {
      default: tokens["--muted-foreground"],
      "[aria-current=step]": tokens["--foreground"],
    },
    counterIncrement: "step",
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: "1.5rem",
    minBlockSize: "2.75rem",
    paddingInlineStart: "2.25rem",
    position: "relative",
    "::marker": { fontSize: 0 },
    "::before": {
      alignItems: "center",
      backgroundColor: {
        default: tokens["--muted"],
        '[data-state="completed"]': tokens["--accent-solid"],
        '[data-state="current"]': tokens["--accent-solid"],
      },
      borderColor: {
        default: tokens["--border"],
        '[data-state="completed"]': tokens["--accent-solid"],
        '[data-state="current"]': tokens["--accent-solid"],
      },
      borderRadius: "50%",
      borderStyle: "solid",
      borderWidth: 1,
      blockSize: "1.5rem",
      boxSizing: "border-box",
      color: {
        default: tokens["--foreground"],
        '[data-state="completed"]': tokens["--accent-solid-foreground"],
        '[data-state="current"]': tokens["--accent-solid-foreground"],
      },
      content: { default: "counter(step)", '[data-state="completed"]': '"✓"' },
      display: "flex",
      fontSize: "0.75rem",
      inlineSize: "1.5rem",
      insetBlockStart: 0,
      insetInlineStart: 0,
      justifyContent: "center",
      position: "absolute",
    },
    "::after": {
      backgroundColor: tokens["--border"],
      blockSize: "calc(100% - 1.5rem)",
      content: '""',
      display: { default: "block", ":last-child": "none" },
      inlineSize: 1,
      insetBlockStart: "1.5rem",
      insetInlineStart: "0.71875rem",
      position: "absolute",
    },
  },
})

type StepStatus = "completed" | "current" | "upcoming"

export function Steps({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"ol">>) {
  return (
    <ol
      data-slot="steps"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        props,
      )}
    />
  )
}

export function StepsItem({
  xstyle: consumerXstyle,
  className,
  status = "upcoming",
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"li">, { status?: StepStatus }>) {
  return (
    <li
      aria-current={status === "current" ? "step" : undefined}
      data-slot="steps-item"
      data-state={status}
      {...mergeStylexProps(
        stylexProps(className, styles.item, consumerXstyle),
        props,
      )}
    />
  )
}

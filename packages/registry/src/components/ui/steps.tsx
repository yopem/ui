import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginBlock: 0,
    paddingInlineStart: "1.5rem",
  },
  item: {
    color: {
      default: tokens["--muted-foreground"],
      "[aria-current=step]": tokens["--foreground"],
    },
    fontWeight: { default: 400, "[aria-current=step]": 600 },
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

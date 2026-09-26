import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: 0,
  },
  label: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  value: {
    color: tokens["--foreground"],
    fontSize: "1.875rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    lineHeight: 1.2,
    margin: 0,
  },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    lineHeight: "1rem",
    margin: 0,
  },
})

export function Stat({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dl">>) {
  return (
    <dl
      data-slot="stat"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        props,
      )}
    />
  )
}

export function StatLabel({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dt">>) {
  return (
    <dt
      data-slot="stat-label"
      {...mergeStylexProps(
        stylexProps(className, styles.label, consumerXstyle),
        props,
      )}
    />
  )
}

export function StatValue({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dd">>) {
  return (
    <dd
      data-slot="stat-value"
      {...mergeStylexProps(
        stylexProps(className, styles.value, consumerXstyle),
        props,
      )}
    />
  )
}

export function StatDescription({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<"dd">>) {
  return (
    <dd
      data-slot="stat-description"
      {...mergeStylexProps(
        stylexProps(className, styles.description, consumerXstyle),
        props,
      )}
    />
  )
}

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: tokens["--muted"],
    blockSize: "1.25rem",
    borderRadius: "0.25rem",
    color: tokens["--muted-foreground"],
    display: "inline-flex",
    fontFamily: tokens["--font-sans"],
    fontSize: "0.75rem",
    fontWeight: 500,
    gap: "0.25rem",
    justifyContent: "center",
    minInlineSize: "1.25rem",
    paddingInline: "0.25rem",
    pointerEvents: "none",
    userSelect: "none",
  },
  group: { alignItems: "center", display: "inline-flex", gap: "0.25rem" },
})

export function Kbd({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"kbd">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <kbd
      data-slot="kbd"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export function KbdGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"kbd">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <kbd
      data-slot="kbd-group"
      {...mergeStyleProps(stylexProps(className, styles.group, xstyle), props)}
    />
  )
}

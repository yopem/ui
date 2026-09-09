import type { StyleXProps } from "@registry/lib/stylex"
import type * as React from "react"

import { stylexProps } from "@registry/lib/stylex"
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
  xstyle,
  className,
  ...props
}: React.ComponentProps<"kbd"> & StyleXProps) {
  return (
    <kbd
      {...stylexProps(className, styles.root, xstyle)}
      data-slot="kbd"
      {...props}
    />
  )
}

export function KbdGroup({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"kbd"> & StyleXProps) {
  return (
    <kbd
      {...stylexProps(className, styles.group, xstyle)}
      data-slot="kbd-group"
      {...props}
    />
  )
}

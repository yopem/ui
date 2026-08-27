import type * as React from "react"

import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: tokens.muted,
    blockSize: "1.25rem",
    borderRadius: "0.25rem",
    color: tokens.mutedForeground,
    display: "inline-flex",
    fontFamily: tokens.fontSans,
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

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd {...stylexProps(className, styles.root)} data-slot="kbd" {...props} />
  )
}

export function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      {...stylexProps(className, styles.group)}
      data-slot="kbd-group"
      {...props}
    />
  )
}

import type * as React from "react"

import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    backgroundColor:
      "color-mix(in oklab, var(--muted, currentColor) 72%, transparent)",
    borderRadius: "1rem",
    display: "flex",
    flexDirection: "column",
    padding: "0.25rem",
    position: "relative",
  },
  panel: {
    backgroundClip: "padding-box",
    backgroundColor: tokens.background,
    borderColor: tokens.border,
    borderRadius: tokens.radiusXLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "0 -1px 0 color-mix(in oklab, #fff 6%, transparent)",
    },
    padding: "1.25rem",
    position: "relative",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    paddingBlock: "1rem",
    paddingInline: "1.25rem",
  },
  title: { fontSize: "0.875rem", fontWeight: 600 },
  description: { color: tokens.mutedForeground, fontSize: "0.875rem" },
  footer: { paddingBlock: "1rem", paddingInline: "1.25rem" },
})

export function Frame({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.root)}
      data-slot="frame"
      {...props}
    />
  )
}
export function FramePanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.panel)}
      data-slot="frame-panel"
      {...props}
    />
  )
}
export function FrameHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      {...stylexProps(className, styles.header)}
      data-slot="frame-panel-header"
      {...props}
    />
  )
}
export function FrameTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.title)}
      data-slot="frame-panel-title"
      {...props}
    />
  )
}
export function FrameDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.description)}
      data-slot="frame-panel-description"
      {...props}
    />
  )
}
export function FrameFooter({
  className,
  ...props
}: React.ComponentProps<"footer">) {
  return (
    <footer
      {...stylexProps(className, styles.footer)}
      data-slot="frame-panel-footer"
      {...props}
    />
  )
}

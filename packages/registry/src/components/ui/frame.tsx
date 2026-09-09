import type { StyleXProps } from "@registry/lib/stylex"
import type * as React from "react"

import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
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
    backgroundColor: tokens["--background"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "0 -1px 0 color-mix(in oklab, #fff 6%, transparent)",
    },
    padding: "1.25rem",
    position: "relative",
    marginBlockStart: {
      default: null,
      ':is([data-slot="frame"] > [data-slot="frame-panel"] + [data-slot="frame-panel"])':
        "0.25rem",
    },
  },
  header: {
    display: "flex",
    flexDirection: "column",
    paddingBlock: "1rem",
    paddingInline: "1.25rem",
  },
  title: {
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
  },
  footer: {
    paddingBlock: "1rem",
    paddingInline: "1.25rem",
  },
})

export function Frame({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"div"> & StyleXProps) {
  return (
    <div
      {...stylexProps(className, styles.root, xstyle)}
      data-slot="frame"
      {...props}
    />
  )
}
export function FramePanel({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"div"> & StyleXProps) {
  return (
    <div
      {...stylexProps(className, styles.panel, xstyle)}
      data-slot="frame-panel"
      {...props}
    />
  )
}
export function FrameHeader({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"header"> & StyleXProps) {
  return (
    <header
      {...stylexProps(className, styles.header, xstyle)}
      data-slot="frame-panel-header"
      {...props}
    />
  )
}
export function FrameTitle({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"div"> & StyleXProps) {
  return (
    <div
      {...stylexProps(className, styles.title, xstyle)}
      data-slot="frame-panel-title"
      {...props}
    />
  )
}
export function FrameDescription({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"div"> & StyleXProps) {
  return (
    <div
      {...stylexProps(className, styles.description, xstyle)}
      data-slot="frame-panel-description"
      {...props}
    />
  )
}
export function FrameFooter({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"footer"> & StyleXProps) {
  return (
    <footer
      {...stylexProps(className, styles.footer, xstyle)}
      data-slot="frame-panel-footer"
      {...props}
    />
  )
}

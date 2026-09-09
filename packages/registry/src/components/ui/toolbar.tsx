"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    backgroundColor: tokens["--card"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--card-foreground"],
    display: "flex",
    gap: "0.5rem",
    padding: "0.25rem",
    position: "relative",
  },
  group: { alignItems: "center", display: "flex", gap: "0.25rem" },
  separator: { backgroundColor: tokens["--border"], flexShrink: 0 },
  horizontal: { blockSize: 1, inlineSize: "100%", marginBlock: "0.125rem" },
  vertical: { alignSelf: "stretch", inlineSize: 1, marginBlock: "0.375rem" },
})

export function Toolbar({
  xstyle,
  className,
  ...props
}: ToolbarPrimitive.Root.Props & StyleXProps) {
  return (
    <ToolbarPrimitive.Root
      {...stylexProps(className, styles.root, xstyle)}
      data-slot="toolbar"
      {...props}
    />
  )
}
export function ToolbarButton({
  xstyle,
  className,
  ...props
}: ToolbarPrimitive.Button.Props & StyleXProps) {
  return (
    <ToolbarPrimitive.Button
      {...stylexProps(className, xstyle)}
      data-slot="toolbar-button"
      {...props}
    />
  )
}
export function ToolbarLink({
  xstyle,
  className,
  ...props
}: ToolbarPrimitive.Link.Props & StyleXProps) {
  return (
    <ToolbarPrimitive.Link
      {...stylexProps(className, xstyle)}
      data-slot="toolbar-link"
      {...props}
    />
  )
}
export function ToolbarInput({
  xstyle,
  className,
  ...props
}: ToolbarPrimitive.Input.Props & StyleXProps) {
  return (
    <ToolbarPrimitive.Input
      {...stylexProps(className, xstyle)}
      data-slot="toolbar-input"
      {...props}
    />
  )
}
export function ToolbarGroup({
  xstyle,
  className,
  ...props
}: ToolbarPrimitive.Group.Props & StyleXProps) {
  return (
    <ToolbarPrimitive.Group
      {...stylexProps(className, styles.group, xstyle)}
      data-slot="toolbar-group"
      {...props}
    />
  )
}
export function ToolbarSeparator({
  xstyle,
  className,
  orientation = "vertical",
  ...props
}: ToolbarPrimitive.Separator.Props & StyleXProps) {
  return (
    <ToolbarPrimitive.Separator
      {...stylexProps(
        className,
        styles.separator,
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
        xstyle,
      )}
      data-slot="toolbar-separator"
      orientation={orientation}
      {...props}
    />
  )
}
export { ToolbarPrimitive }

"use client"

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    backgroundColor: tokens.card,
    borderColor: tokens.border,
    borderRadius: tokens.radiusXLarge,
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens.cardForeground,
    display: "flex",
    gap: "0.5rem",
    padding: "0.25rem",
    position: "relative",
  },
  group: { alignItems: "center", display: "flex", gap: "0.25rem" },
  separator: { backgroundColor: tokens.border, flexShrink: 0 },
  horizontal: { blockSize: 1, inlineSize: "100%", marginBlock: "0.125rem" },
  vertical: { alignSelf: "stretch", inlineSize: 1, marginBlock: "0.375rem" },
})

export function Toolbar({ className, ...props }: ToolbarPrimitive.Root.Props) {
  return (
    <ToolbarPrimitive.Root
      {...stylexProps(className, styles.root)}
      data-slot="toolbar"
      {...props}
    />
  )
}
export function ToolbarButton({
  className,
  ...props
}: ToolbarPrimitive.Button.Props) {
  return (
    <ToolbarPrimitive.Button
      className={className}
      data-slot="toolbar-button"
      {...props}
    />
  )
}
export function ToolbarLink({
  className,
  ...props
}: ToolbarPrimitive.Link.Props) {
  return (
    <ToolbarPrimitive.Link
      className={className}
      data-slot="toolbar-link"
      {...props}
    />
  )
}
export function ToolbarInput({
  className,
  ...props
}: ToolbarPrimitive.Input.Props) {
  return (
    <ToolbarPrimitive.Input
      className={className}
      data-slot="toolbar-input"
      {...props}
    />
  )
}
export function ToolbarGroup({
  className,
  ...props
}: ToolbarPrimitive.Group.Props) {
  return (
    <ToolbarPrimitive.Group
      {...stylexProps(className, styles.group)}
      data-slot="toolbar-group"
      {...props}
    />
  )
}
export function ToolbarSeparator({
  className,
  orientation = "vertical",
  ...props
}: ToolbarPrimitive.Separator.Props) {
  return (
    <ToolbarPrimitive.Separator
      {...stylexProps(
        className,
        styles.separator,
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
      )}
      data-slot="toolbar-separator"
      orientation={orientation}
      {...props}
    />
  )
}
export { ToolbarPrimitive }

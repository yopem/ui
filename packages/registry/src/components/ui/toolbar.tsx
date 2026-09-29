"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ToolbarPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export function ToolbarButton({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ToolbarPrimitive.Button.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ToolbarPrimitive.Button
      data-slot="toolbar-button"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function ToolbarLink({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ToolbarPrimitive.Link.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ToolbarPrimitive.Link
      data-slot="toolbar-link"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function ToolbarInput({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ToolbarPrimitive.Input.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ToolbarPrimitive.Input
      data-slot="toolbar-input"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function ToolbarGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ToolbarPrimitive.Group.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ToolbarPrimitive.Group
      data-slot="toolbar-group"
      {...mergeStylexProps(stylexProps(className, styles.group, xstyle), props)}
    />
  )
}

export function ToolbarSeparator({
  xstyle: consumerXstyle,
  className,
  orientation = "vertical",
  ...restProps
}: StyleXComponentProps<ToolbarPrimitive.Separator.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ToolbarPrimitive.Separator
      data-slot="toolbar-separator"
      orientation={orientation}
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.separator,
          orientation === "horizontal" ? styles.horizontal : styles.vertical,
          xstyle,
        ),
        props,
      )}
    />
  )
}

export { ToolbarPrimitive }

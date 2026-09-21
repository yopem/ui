import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="frame"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}
export function FramePanel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="frame-panel"
      {...mergeStyleProps(stylexProps(className, styles.panel, xstyle), props)}
    />
  )
}
export function FrameHeader({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"header">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <header
      data-slot="frame-panel-header"
      {...mergeStyleProps(stylexProps(className, styles.header, xstyle), props)}
    />
  )
}
export function FrameTitle({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="frame-panel-title"
      {...mergeStyleProps(stylexProps(className, styles.title, xstyle), props)}
    />
  )
}
export function FrameDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="frame-panel-description"
      {...mergeStyleProps(
        stylexProps(className, styles.description, xstyle),
        props,
      )}
    />
  )
}
export function FrameFooter({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"footer">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <footer
      data-slot="frame-panel-footer"
      {...mergeStyleProps(stylexProps(className, styles.footer, xstyle), props)}
    />
  )
}

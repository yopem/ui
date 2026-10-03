import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="frame"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export function FramePanel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="frame-panel"
      {...mergeStylexProps(stylexProps(className, styles.panel, xstyle), props)}
    />
  )
}

export function FrameHeader({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"header">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <header
      data-slot="frame-panel-header"
      {...mergeStylexProps(
        stylexProps(className, styles.header, xstyle),
        props,
      )}
    />
  )
}

export function FrameTitle({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="frame-panel-title"
      {...mergeStylexProps(stylexProps(className, styles.title, xstyle), props)}
    />
  )
}

export function FrameDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="frame-panel-description"
      {...mergeStylexProps(
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
}: StyleXComponentProps<ComponentProps<"footer">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <footer
      data-slot="frame-panel-footer"
      {...mergeStylexProps(
        stylexProps(className, styles.footer, xstyle),
        props,
      )}
    />
  )
}

"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronRight, MoreHorizontal } from "lucide-react"

const styles = stylex.create({
  list: {
    alignItems: "center",
    color: tokens["--muted-foreground"],
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.875rem",
    gap: { default: "0.375rem", "@media (min-width: 640px)": "0.625rem" },
    overflowWrap: "break-word",
  },
  item: { alignItems: "center", display: "inline-flex", gap: "0.375rem" },
  link: {
    color: { default: null, ":hover": tokens["--foreground"] },
    transitionProperty: "color",
  },
  page: { color: tokens["--foreground"], fontWeight: 400 },
  separator: { opacity: 0.8 },
  icon: { blockSize: "1rem", inlineSize: "1rem" },
  srOnly: {
    blockSize: 1,
    clip: "rect(0, 0, 0, 0)",
    inlineSize: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
  },
})

export function Breadcrumb({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"nav">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function BreadcrumbList({
  xstyle: consumerXstyle,
  className,
  start,
  ...restProps
}: StyleXComponentProps<
  React.ComponentProps<"ol">,
  Pick<React.ComponentProps<"ol">, "start">
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ol
      start={start}
      data-slot="breadcrumb-list"
      {...mergeStylexProps(stylexProps(className, styles.list, xstyle), props)}
    />
  )
}

export function BreadcrumbItem({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"li">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <li
      data-slot="breadcrumb-item"
      {...mergeStylexProps(stylexProps(className, styles.item, xstyle), props)}
    />
  )
}

export function BreadcrumbLink({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"a">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.link, xstyle),
    "data-slot": "breadcrumb-link",
  }

  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  })
}

export function BreadcrumbPage({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"span">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <span
      aria-current="page"

      data-slot="breadcrumb-page"
      {...mergeStylexProps(stylexProps(className, styles.page, xstyle), props)}
    />
  )
}

export function BreadcrumbSeparator({
  xstyle: consumerXstyle,
  children,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"li">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <li
      aria-hidden="true"

      data-slot="breadcrumb-separator"
      role="presentation"
      {...mergeStylexProps(
        stylexProps(className, styles.separator, xstyle),
        props,
      )}
    >
      {children ?? <ChevronRight {...stylex.props(styles.icon)} />}
    </li>
  )
}

export function BreadcrumbEllipsis({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"span">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <span
      aria-hidden="true"

      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    >
      <MoreHorizontal {...stylex.props(styles.icon)} />
      <span {...stylex.props(styles.srOnly)}>More</span>
    </span>
  )
}

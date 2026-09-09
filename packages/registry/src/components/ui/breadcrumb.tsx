"use client"

import type { StyleXProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"
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

export function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

export function BreadcrumbList({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"ol"> & StyleXProps) {
  return (
    <ol
      {...stylexProps(className, styles.list, xstyle)}
      data-slot="breadcrumb-list"
      {...props}
    />
  )
}

export function BreadcrumbItem({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"li"> & StyleXProps) {
  return (
    <li
      {...stylexProps(className, styles.item, xstyle)}
      data-slot="breadcrumb-item"
      {...props}
    />
  )
}

export function BreadcrumbLink({
  xstyle,
  className,
  render,
  ...props
}: useRender.ComponentProps<"a"> & StyleXProps) {
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
  xstyle,
  className,
  ...props
}: React.ComponentProps<"span"> & StyleXProps) {
  return (
    <span
      aria-current="page"
      {...stylexProps(className, styles.page, xstyle)}
      data-slot="breadcrumb-page"
      {...props}
    />
  )
}

export function BreadcrumbSeparator({
  xstyle,
  children,
  className,
  ...props
}: React.ComponentProps<"li"> & StyleXProps) {
  return (
    <li
      aria-hidden="true"
      {...stylexProps(className, styles.separator, xstyle)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRight {...stylex.props(styles.icon)} />}
    </li>
  )
}

export function BreadcrumbEllipsis({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"span"> & StyleXProps) {
  return (
    <span
      aria-hidden="true"
      {...stylexProps(className, xstyle)}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <MoreHorizontal {...stylex.props(styles.icon)} />
      <span {...stylex.props(styles.srOnly)}>More</span>
    </span>
  )
}

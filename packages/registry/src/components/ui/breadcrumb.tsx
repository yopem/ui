"use client"

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
    color: tokens.mutedForeground,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.875rem",
    gap: { default: "0.375rem", "@media (min-width: 640px)": "0.625rem" },
    overflowWrap: "break-word",
  },
  item: { alignItems: "center", display: "inline-flex", gap: "0.375rem" },
  link: {
    color: { default: null, ":hover": tokens.foreground },
    transitionProperty: "color",
  },
  page: { color: tokens.foreground, fontWeight: 400 },
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
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      {...stylexProps(className, styles.list)}
      data-slot="breadcrumb-list"
      {...props}
    />
  )
}

export function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      {...stylexProps(className, styles.item)}
      data-slot="breadcrumb-item"
      {...props}
    />
  )
}

export function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  const defaultProps = {
    ...stylexProps(className, styles.link),
    "data-slot": "breadcrumb-link",
  }
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  })
}

export function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-current="page"
      {...stylexProps(className, styles.page)}
      data-slot="breadcrumb-page"
      {...props}
    />
  )
}

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      aria-hidden="true"
      {...stylexProps(className, styles.separator)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRight {...stylex.props(styles.icon)} />}
    </li>
  )
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={className}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <MoreHorizontal {...stylex.props(styles.icon)} />
      <span {...stylex.props(styles.srOnly)}>More</span>
    </span>
  )
}

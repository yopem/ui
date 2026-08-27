"use client"

import type React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  container: { inlineSize: "100%", overflowX: "auto", position: "relative" },
  table: {
    borderSpacing: 0,
    captionSide: "bottom",
    fontSize: "0.875rem",
    inlineSize: "100%",
  },
  body: { position: "relative" },
  footer: {
    backgroundColor: "transparent",
    borderBlockStartColor: tokens.border,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    fontWeight: 500,
  },
  row: {
    borderBlockEndColor: tokens.border,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    position: "relative",
    backgroundColor: {
      default: "transparent",
      ":hover": "color-mix(in srgb, var(--background), #000 2%)",
      "[data-state=selected]": "color-mix(in srgb, var(--background), #000 4%)",
    },
  },
  head: {
    blockSize: "2.5rem",
    color: tokens.mutedForeground,
    fontWeight: 500,
    lineHeight: 1,
    paddingInline: "0.625rem",
    textAlign: "start",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  cell: {
    backgroundClip: "padding-box",
    lineHeight: 1,
    padding: "0.625rem",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  caption: {
    color: tokens.mutedForeground,
    fontSize: "0.875rem",
    marginBlockStart: "1rem",
  },
})

export type TableVariant = "default" | "card"
export type TableProps = React.ComponentProps<"table"> & {
  variant?: TableVariant
  render?: useRender.ComponentProps<"div">["render"]
}

export function Table({
  className,
  variant = "default",
  render,
  ...props
}: TableProps) {
  const defaultProps = {
    children: (
      <table
        {...stylexProps(className, styles.table)}
        data-slot="table"
        {...props}
      />
    ),
    ...stylex.props(styles.container),
    "data-slot": "table-container",
    "data-variant": variant,
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, {}),
    render,
  })
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return <thead className={className} data-slot="table-header" {...props} />
}
export function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return (
    <tbody
      {...stylexProps(className, styles.body)}
      data-slot="table-body"
      {...props}
    />
  )
}
export function TableFooter({
  className,
  ...props
}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      {...stylexProps(className, styles.footer)}
      data-slot="table-footer"
      {...props}
    />
  )
}
export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      {...stylexProps(className, styles.row)}
      data-slot="table-row"
      {...props}
    />
  )
}
export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      {...stylexProps(className, styles.head)}
      data-slot="table-head"
      {...props}
    />
  )
}
export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      {...stylexProps(className, styles.cell)}
      data-slot="table-cell"
      {...props}
    />
  )
}
export function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      {...stylexProps(className, styles.caption)}
      data-slot="table-caption"
      {...props}
    />
  )
}

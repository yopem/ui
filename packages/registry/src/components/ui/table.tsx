"use client"

import type { StyleXProps } from "@registry/lib/stylex"
import type React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  container: {
    inlineSize: {
      default: "100%",
      ':is([data-slot="card-frame"] > [data-slot="table-container"])':
        "calc(100% + 2px)",
    },
    overflowX: "auto",
    position: "relative",
    margin: {
      default: null,
      ':is([data-slot="card-frame"] > [data-slot="table-container"])': "-1px",
    },
  },
  table: {
    borderSpacing: {
      default: 0,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table"])': 0,
    },
    captionSide: "bottom",
    fontSize: "0.875rem",
    inlineSize: "100%",
    borderCollapse: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table"])':
        "separate",
    },
  },
  body: {
    position: "relative",
    borderRadius: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-body"])':
        tokens["--radius-xl"],
    },
    boxShadow: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-body"])':
        "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    },
  },
  footer: {
    backgroundColor: "transparent",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    fontWeight: 500,
  },
  row: {
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: {
      default: 1,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"])': 0,
    },
    position: "relative",
    backgroundColor: {
      default: "transparent",
      ":hover": "color-mix(in srgb, var(--background), #000 2%)",
      "[data-state=selected]": "color-mix(in srgb, var(--background), #000 4%)",
    },
  },
  head: {
    blockSize: "2.5rem",
    color: tokens["--muted-foreground"],
    fontWeight: 500,
    lineHeight: 1,
    paddingInline: "0.625rem",
    textAlign: "start",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    inlineSize: {
      default: null,
      ':has([role="checkbox"])': "1px",
    },
    paddingInlineEnd: {
      default: "0.625rem",
      ':first-child:has([role="checkbox"])': 0,
    },
    paddingInlineStart: {
      default: "0.625rem",
      ':last-child:has([role="checkbox"])': 0,
    },
  },
  cell: {
    backgroundClip: "padding-box",
    lineHeight: 1,
    padding: "0.625rem",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    backgroundColor: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-cell"])':
        tokens["--card"],
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"]:hover [data-slot="table-cell"])':
        "color-mix(in srgb, var(--card), #000 2%)",
      ':is([data-theme="dark"] [data-slot="table-container"][data-variant="card"] [data-slot="table-row"]:hover [data-slot="table-cell"])':
        "color-mix(in srgb, var(--card), #fff 2%)",
    },
    borderBlockEnd: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-cell"])':
        "1px solid var(--border, currentColor)",
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"]:last-child [data-slot="table-cell"])': 0,
    },
    inlineSize: {
      default: null,
      ':has([role="checkbox"])': "1px",
    },
    paddingInlineEnd: {
      default: "0.625rem",
      ':first-child:has([role="checkbox"])': 0,
    },
    paddingInlineStart: {
      default: "0.625rem",
      ':last-child:has([role="checkbox"])': 0,
    },
  },
  caption: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    marginBlockStart: "1rem",
  },
})

export type TableVariant = "default" | "card"
export type TableProps = StyleXProps &
  React.ComponentProps<"table"> & {
    variant?: TableVariant
    render?: useRender.ComponentProps<"div">["render"]
  }

export function Table({
  xstyle,
  className,
  variant = "default",
  render,
  ...props
}: TableProps & StyleXProps) {
  const defaultProps = {
    children: (
      <table
        {...stylexProps(className, styles.table, xstyle)}
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
  xstyle,
  className,
  ...props
}: React.ComponentProps<"thead"> & StyleXProps) {
  return (
    <thead
      {...stylexProps(className, xstyle)}
      data-slot="table-header"
      {...props}
    />
  )
}
export function TableBody({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"tbody"> & StyleXProps) {
  return (
    <tbody
      {...stylexProps(className, styles.body, xstyle)}
      data-slot="table-body"
      {...props}
    />
  )
}
export function TableFooter({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"tfoot"> & StyleXProps) {
  return (
    <tfoot
      {...stylexProps(className, styles.footer, xstyle)}
      data-slot="table-footer"
      {...props}
    />
  )
}
export function TableRow({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"tr"> & StyleXProps) {
  return (
    <tr
      {...stylexProps(className, styles.row, xstyle)}
      data-slot="table-row"
      {...props}
    />
  )
}
export function TableHead({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"th"> & StyleXProps) {
  return (
    <th
      {...stylexProps(className, styles.head, xstyle)}
      data-slot="table-head"
      {...props}
    />
  )
}
export function TableCell({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"td"> & StyleXProps) {
  return (
    <td
      {...stylexProps(className, styles.cell, xstyle)}
      data-slot="table-cell"
      {...props}
    />
  )
}
export function TableCaption({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"caption"> & StyleXProps) {
  return (
    <caption
      {...stylexProps(className, styles.caption, xstyle)}
      data-slot="table-caption"
      {...props}
    />
  )
}

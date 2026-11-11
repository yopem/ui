"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
    "--table-row-border-width": "0px",
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
  rowBorders: { "--table-row-border-width": "1px" },
  body: {
    position: "relative",
    borderRadius: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-body"])':
        tokens["--radius"],
    },
    boxShadow: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-body"])':
        tokens["--shadow-sm"],
    },
  },
  footer: {
    backgroundColor: "transparent",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "var(--table-row-border-width, 0px)",
    fontWeight: 500,
  },
  row: {
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: {
      default: "var(--table-row-border-width, 0px)",
      ':is([data-slot="table-body"] > [data-slot="table-row"]:last-child)': 0,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"])': 0,
    },
    position: "relative",
    backgroundColor: {
      default: "transparent",
      ":hover": tokens["--muted"],
      "[data-state=selected]": tokens["--accent"],
    },
  },
  head: {
    blockSize: "3rem",
    color: tokens["--muted-foreground"],
    fontWeight: 500,
    lineHeight: 1,
    paddingInline: "1rem",
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
    padding: "1rem",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    backgroundColor: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-cell"])':
        tokens["--card"],
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"][data-state="selected"] [data-slot="table-cell"])':
        tokens["--accent"],
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-row"]:hover [data-slot="table-cell"])':
        tokens["--muted"],
    },
    borderBlockEnd: {
      default: null,
      ':is([data-slot="table-container"][data-variant="card"] [data-slot="table-cell"])':
        "var(--table-row-border-width, 0px) solid var(--border, currentColor)",
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

export type TableProps = StyleXComponentProps<
  ComponentProps<"table">,
  {
    variant?: TableVariant
    rowBorders?: boolean
    render?: useRender.ComponentProps<"div">["render"]
  }
>

export function Table({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  rowBorders = false,
  render,
  ...restProps
}: StyleXComponentProps<TableProps>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    children: (
      <table
        data-slot="table"
        {...mergeStylexProps(
          stylexProps(
            className,
            styles.table,
            rowBorders && styles.rowBorders,
            xstyle,
          ),
          props,
        )}
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"thead">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <thead
      data-slot="table-header"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function TableBody({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"tbody">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <tbody
      data-slot="table-body"
      {...mergeStylexProps(stylexProps(className, styles.body, xstyle), props)}
    />
  )
}

export function TableFooter({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"tfoot">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <tfoot
      data-slot="table-footer"
      {...mergeStylexProps(
        stylexProps(className, styles.footer, xstyle),
        props,
      )}
    />
  )
}

export function TableRow({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"tr">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <tr
      data-slot="table-row"
      {...mergeStylexProps(stylexProps(className, styles.row, xstyle), props)}
    />
  )
}

export function TableHead({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"th">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <th
      data-slot="table-head"
      {...mergeStylexProps(stylexProps(className, styles.head, xstyle), props)}
    />
  )
}

export function TableCell({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"td">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <td
      data-slot="table-cell"
      {...mergeStylexProps(stylexProps(className, styles.cell, xstyle), props)}
    />
  )
}

export function TableCaption({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"caption">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <caption
      data-slot="table-caption"
      {...mergeStylexProps(
        stylexProps(className, styles.caption, xstyle),
        props,
      )}
    />
  )
}

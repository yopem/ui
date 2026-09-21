"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
export type TableProps = StyleComponentProps<
  React.ComponentProps<"table">,
  {
    variant?: TableVariant
    render?: useRender.ComponentProps<"div">["render"]
  }
>

export function Table({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  render,
  ...restProps
}: StyleComponentProps<TableProps>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  const defaultProps = {
    children: (
      <table
        data-slot="table"
        {...mergeStyleProps(
          stylexProps(className, styles.table, xstyle),
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
}: StyleComponentProps<React.ComponentProps<"thead">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <thead
      data-slot="table-header"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}
export function TableBody({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"tbody">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <tbody
      data-slot="table-body"
      {...mergeStyleProps(stylexProps(className, styles.body, xstyle), props)}
    />
  )
}
export function TableFooter({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"tfoot">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <tfoot
      data-slot="table-footer"
      {...mergeStyleProps(stylexProps(className, styles.footer, xstyle), props)}
    />
  )
}
export function TableRow({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"tr">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <tr
      data-slot="table-row"
      {...mergeStyleProps(stylexProps(className, styles.row, xstyle), props)}
    />
  )
}
export function TableHead({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"th">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <th
      data-slot="table-head"
      {...mergeStyleProps(stylexProps(className, styles.head, xstyle), props)}
    />
  )
}
export function TableCell({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"td">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <td
      data-slot="table-cell"
      {...mergeStyleProps(stylexProps(className, styles.cell, xstyle), props)}
    />
  )
}
export function TableCaption({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"caption">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <caption
      data-slot="table-caption"
      {...mergeStyleProps(
        stylexProps(className, styles.caption, xstyle),
        props,
      )}
    />
  )
}

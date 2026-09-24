import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"
import { createElement } from "react"

const styles = stylex.create({
  root: {
    boxSizing: "border-box",
    minInlineSize: 0,
  },
})

export type BoxElement = keyof React.JSX.IntrinsicElements

export type BoxProps<Tag extends BoxElement = "div"> = StyleXComponentProps<
  React.ComponentPropsWithRef<Tag>,
  { as?: Tag }
>

export function Box<Tag extends BoxElement = "div">({
  as,
  xstyle,
  className,
  ...props
}: BoxProps<Tag>) {
  const Component: React.ElementType = as ?? "div"
  return createElement(
    Component,
    mergeStylexProps(
      { ...stylexProps(className, styles.root, xstyle), "data-slot": "box" },
      props,
    ),
  )
}

"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  },
})

type CenterElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type CenterProps = StyleComponentProps<CenterElementProps>

export function Center({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: CenterProps) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="center"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

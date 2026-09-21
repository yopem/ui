"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
})

type StackElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type StackProps = StyleComponentProps<StackElementProps>

export function Stack({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: StackProps) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="stack"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

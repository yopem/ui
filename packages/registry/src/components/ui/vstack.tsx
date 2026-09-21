"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
})

type VStackElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type VStackProps = StyleComponentProps<VStackElementProps>

export function VStack({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: VStackProps) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="vstack"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

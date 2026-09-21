"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: { display: "flex" },
})

type FlexElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type FlexProps = StyleComponentProps<FlexElementProps>

export function Flex({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: FlexProps) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="flex"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

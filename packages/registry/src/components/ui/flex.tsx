"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: { display: "flex" },
})

type FlexElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type FlexProps = StyleXComponentProps<FlexElementProps>

export function Flex({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: FlexProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="flex"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

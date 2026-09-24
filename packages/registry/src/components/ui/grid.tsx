"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: { display: "grid" },
})

type GridElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type GridProps = StyleXComponentProps<GridElementProps>

export function Grid({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: GridProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="grid"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

"use client"

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"
import type * as React from "react"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: { display: "grid" },
})

type GridElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type GridProps = StyleComponentProps<GridElementProps>

export function Grid({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: GridProps) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="grid"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

"use client"

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"
import type * as React from "react"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
})

type HStackElementProps = React.ComponentPropsWithoutRef<"div"> &
  React.RefAttributes<HTMLDivElement>

export type HStackProps = StyleComponentProps<HStackElementProps>

export function HStack({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: HStackProps) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="hstack"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

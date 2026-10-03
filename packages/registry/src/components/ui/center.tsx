"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithoutRef, RefAttributes } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  },
})

type CenterElementProps = ComponentPropsWithoutRef<"div"> &
  RefAttributes<HTMLDivElement>

export type CenterProps = StyleXComponentProps<CenterElementProps>

export function Center({
  xstyle: consumerXstyle,
  className,
  ref,
  ...restProps
}: CenterProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="center"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
      ref={ref}
    />
  )
}

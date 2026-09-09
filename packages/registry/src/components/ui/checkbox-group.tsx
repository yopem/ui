"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group"
import { stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    alignItems: "start",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
})

export function CheckboxGroup({
  xstyle,
  className,
  ...props
}: CheckboxGroupPrimitive.Props & StyleXProps) {
  return (
    <CheckboxGroupPrimitive
      {...stylexProps(className, styles.root, xstyle)}
      {...props}
    />
  )
}

export { CheckboxGroupPrimitive }

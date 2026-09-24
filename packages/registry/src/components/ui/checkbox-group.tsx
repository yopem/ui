"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<CheckboxGroupPrimitive.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CheckboxGroupPrimitive
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export { CheckboxGroupPrimitive }

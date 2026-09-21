"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
}: StyleComponentProps<CheckboxGroupPrimitive.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <CheckboxGroupPrimitive
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export { CheckboxGroupPrimitive }

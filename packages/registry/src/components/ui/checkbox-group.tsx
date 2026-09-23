"use client"

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group"
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
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <CheckboxGroupPrimitive
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export { CheckboxGroupPrimitive }

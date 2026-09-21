"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"

import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  legend: { color: tokens["--foreground"], fontWeight: 600 },
})

export function Fieldset({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FieldsetPrimitive.Root.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}
export function FieldsetLegend({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FieldsetPrimitive.Legend.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FieldsetPrimitive.Legend
      data-slot="fieldset-legend"
      {...mergeStyleProps(stylexProps(className, styles.legend, xstyle), props)}
    />
  )
}
export { FieldsetPrimitive }

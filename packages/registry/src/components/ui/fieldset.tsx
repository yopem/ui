"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  legend: { color: tokens["--foreground"], fontWeight: 600 },
})

export function Fieldset({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<FieldsetPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}
export function FieldsetLegend({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<FieldsetPrimitive.Legend.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <FieldsetPrimitive.Legend
      data-slot="fieldset-legend"
      {...mergeStylexProps(
        stylexProps(className, styles.legend, xstyle),
        props,
      )}
    />
  )
}
export { FieldsetPrimitive }

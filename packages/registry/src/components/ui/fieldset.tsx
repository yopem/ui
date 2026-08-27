"use client"

import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  legend: { color: tokens.foreground, fontWeight: 600 },
})

export function Fieldset({
  className,
  ...props
}: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      className={className}
      data-slot="fieldset"
      {...props}
    />
  )
}
export function FieldsetLegend({
  className,
  ...props
}: FieldsetPrimitive.Legend.Props) {
  return (
    <FieldsetPrimitive.Legend
      {...stylexProps(className, styles.legend)}
      data-slot="fieldset-legend"
      {...props}
    />
  )
}
export { FieldsetPrimitive }

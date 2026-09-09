"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  legend: { color: tokens["--foreground"], fontWeight: 600 },
})

export function Fieldset({
  xstyle,
  className,
  ...props
}: FieldsetPrimitive.Root.Props & StyleXProps) {
  return (
    <FieldsetPrimitive.Root
      {...stylexProps(className, xstyle)}
      data-slot="fieldset"
      {...props}
    />
  )
}
export function FieldsetLegend({
  xstyle,
  className,
  ...props
}: FieldsetPrimitive.Legend.Props & StyleXProps) {
  return (
    <FieldsetPrimitive.Legend
      {...stylexProps(className, styles.legend, xstyle)}
      data-slot="fieldset-legend"
      {...props}
    />
  )
}
export { FieldsetPrimitive }

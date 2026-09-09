"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Form as FormPrimitive } from "@base-ui/react/form"
import { stylexProps } from "@registry/lib/stylex"

export function Form({
  xstyle,
  className,
  ...props
}: FormPrimitive.Props & StyleXProps) {
  return (
    <FormPrimitive
      {...stylexProps(className, xstyle)}
      data-slot="form"
      {...props}
    />
  )
}

export { FormPrimitive }

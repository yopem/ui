"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"

import { Form as FormPrimitive } from "@base-ui/react/form"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"

export function Form({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FormPrimitive.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <FormPrimitive
      data-slot="form"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

export { FormPrimitive }

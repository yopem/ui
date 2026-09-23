"use client"

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { Form as FormPrimitive } from "@base-ui/react/form"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"

export function Form({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<FormPrimitive.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <FormPrimitive
      data-slot="form"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

export { FormPrimitive }

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"

export type TextProps = StyleXComponentProps<ComponentProps<"p">>

export function Text({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: TextProps) {
  return (
    <p
      data-slot="text"
      {...mergeStylexProps(stylexProps(className, consumerXstyle), restProps)}
    />
  )
}

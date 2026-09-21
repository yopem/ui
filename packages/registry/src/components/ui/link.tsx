import type { StyleComponentProps } from "@registry/lib/style-props"
import type { ComponentProps } from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"

export type LinkProps = StyleComponentProps<ComponentProps<"a">>

export function Link({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: LinkProps) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <a
      data-slot="link"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    >
      {children}
    </a>
  )
}

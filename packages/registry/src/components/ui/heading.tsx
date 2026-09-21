import type { StyleComponentProps } from "@registry/lib/style-props"
import type { ComponentProps } from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export type HeadingProps = StyleComponentProps<
  ComponentProps<"h2">,
  { as?: HeadingTag }
>

export function Heading({
  as: Component = "h2",
  xstyle: consumerXstyle,
  className,
  ...restProps
}: HeadingProps) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <Component
      data-slot="heading"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

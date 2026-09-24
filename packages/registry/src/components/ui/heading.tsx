import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export type HeadingProps = StyleXComponentProps<
  ComponentProps<"h2">,
  { as?: HeadingTag }
>

export function Heading({
  as: Component = "h2",
  xstyle: consumerXstyle,
  className,
  ...restProps
}: HeadingProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <Component
      data-slot="heading"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"
import type { ComponentProps } from "react"

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
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <Component
      data-slot="heading"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

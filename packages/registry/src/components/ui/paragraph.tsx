import type { StyleComponentProps } from "@registry/lib/style-props"
import type { ComponentProps } from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"

export type ParagraphProps = StyleComponentProps<ComponentProps<"p">>

export function Paragraph({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: ParagraphProps) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <p
      data-slot="paragraph"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

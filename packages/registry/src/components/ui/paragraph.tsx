import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"

export type ParagraphProps = StyleXComponentProps<ComponentProps<"p">>

export function Paragraph({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: ParagraphProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <p
      data-slot="paragraph"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"
import type { ComponentProps } from "react"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"

export type ParagraphProps = StyleComponentProps<ComponentProps<"p">>

export function Paragraph({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: ParagraphProps) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <p
      data-slot="paragraph"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

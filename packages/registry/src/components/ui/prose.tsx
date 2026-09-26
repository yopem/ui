import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    lineHeight: 1.7,
    maxInlineSize: "68ch",
  },
})

export type ProseProps = StyleXComponentProps<ComponentProps<"div">>

export function Prose({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: ProseProps) {
  return (
    <div
      data-slot="prose"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        restProps,
      )}
    />
  )
}

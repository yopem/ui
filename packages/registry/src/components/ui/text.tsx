import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: 1.5,
    margin: 0,
  },
})

export type TextProps = StyleXComponentProps<ComponentProps<"p">>

export function Text({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: TextProps) {
  return (
    <p
      data-slot="text"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        restProps,
      )}
    />
  )
}

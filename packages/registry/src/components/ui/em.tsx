import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    color: tokens["--foreground"],
    fontStyle: "italic",
  },
})

export type EmProps = StyleXComponentProps<ComponentProps<"em">>

export function Em({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: EmProps) {
  return (
    <em
      data-slot="em"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        restProps,
      )}
    />
  )
}

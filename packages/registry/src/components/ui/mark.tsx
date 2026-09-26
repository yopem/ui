import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    backgroundColor: tokens["--accent"],
    borderRadius: tokens["--radius-sm"],
    color: tokens["--accent-foreground"],
    paddingInline: "0.125em",
  },
})

export type MarkProps = StyleXComponentProps<ComponentProps<"mark">>

export function Mark({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: MarkProps) {
  return (
    <mark
      data-slot="mark"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        restProps,
      )}
    />
  )
}

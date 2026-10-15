import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: 600,
    lineHeight: "inherit",
  },
})

export type StrongProps = StyleXComponentProps<ComponentProps<"strong">>

export function Strong({ xstyle, className, ...props }: StrongProps) {
  return (
    <strong
      data-slot="strong"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

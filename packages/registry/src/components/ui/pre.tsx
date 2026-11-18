import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    color: tokens["--foreground"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.875rem",
    lineHeight: 1.65,
    margin: 0,
    minInlineSize: 0,
    overflowX: "auto",
    whiteSpace: "pre",
  },
})

export type PreProps = StyleXComponentProps<ComponentProps<"pre">>

export function Pre({ xstyle, className, ...props }: PreProps) {
  return (
    <pre
      data-slot="pre"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

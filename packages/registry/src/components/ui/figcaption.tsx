import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    color: tokens["--muted-foreground"],
    fontFamily: tokens["--font-sans"],
    fontSize: "0.875rem",
    lineHeight: 1.5,
    margin: 0,
  },
})

export type FigcaptionProps = StyleXComponentProps<ComponentProps<"figcaption">>

export function Figcaption({ xstyle, className, ...props }: FigcaptionProps) {
  return (
    <figcaption
      data-slot="figcaption"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

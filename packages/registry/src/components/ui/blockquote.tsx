import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    borderInlineStartColor: tokens["--border"],
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: "0.25rem",
    color: tokens["--muted-foreground"],
    fontStyle: "italic",
    lineHeight: 1.65,
    marginBlock: "1.5rem",
    marginInline: 0,
    paddingInlineStart: "1rem",
  },
})

export type BlockquoteProps = StyleXComponentProps<ComponentProps<"blockquote">>

export function Blockquote({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: BlockquoteProps) {
  return (
    <blockquote
      data-slot="blockquote"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        restProps,
      )}
    />
  )
}

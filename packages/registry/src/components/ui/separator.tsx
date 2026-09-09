import type { StyleXProps } from "@registry/lib/stylex"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    backgroundColor: tokens["--border"],
    flexShrink: 0,
  },
  horizontal: { blockSize: 1, inlineSize: "100%" },
  vertical: { alignSelf: "stretch", inlineSize: 1 },
})

export function Separator({
  xstyle,
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props & StyleXProps) {
  return (
    <SeparatorPrimitive
      {...stylexProps(
        className,
        styles.root,
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
        xstyle,
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  )
}

export { SeparatorPrimitive }

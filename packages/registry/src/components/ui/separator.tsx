import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
  xstyle: consumerXstyle,
  className,
  orientation = "horizontal",
  ...restProps
}: StyleXComponentProps<SeparatorPrimitive.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.root,
          orientation === "horizontal" ? styles.horizontal : styles.vertical,
          xstyle,
        ),
        props,
      )}
    />
  )
}

export { SeparatorPrimitive }

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
}: StyleComponentProps<SeparatorPrimitive.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      {...mergeStyleProps(
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

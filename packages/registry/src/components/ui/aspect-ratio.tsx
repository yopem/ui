import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    inlineSize: "100%",
    minInlineSize: 0,
  },
  ratio: (ratio: number) => ({ aspectRatio: ratio }),
})

export type AspectRatioProps = StyleXComponentProps<
  ComponentProps<"div">,
  { ratio?: number }
>

export function AspectRatio({
  ratio = 16 / 9,
  xstyle,
  className,
  ...props
}: AspectRatioProps) {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9

  return (
    <div
      data-slot="aspect-ratio"
      {...mergeStylexProps(
        stylexProps(className, styles.root, styles.ratio(safeRatio), xstyle),
        props,
      )}
    />
  )
}

"use client"

import { AbsoluteCenter } from "@registry/components/ui/absolute-center"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  area: {
    position: "relative",
    minBlockSize: "8rem",
    borderWidth: 1,
    borderStyle: "solid",
  },
})

export function Preview() {
  return (
    <div {...stylex.props(styles.area)}>
      <AbsoluteCenter>Centered</AbsoluteCenter>
    </div>
  )
}

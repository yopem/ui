"use client"

import { AbsoluteCenter } from "@registry/components/ui/absolute-center"
import { Box } from "@registry/components/ui/box"
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
    <Box xstyle={styles.area}>
      <AbsoluteCenter>Centered</AbsoluteCenter>
    </Box>
  )
}

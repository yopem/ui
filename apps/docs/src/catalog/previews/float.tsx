"use client"

import { Box } from "@registry/components/ui/box"
import { Float } from "@registry/components/ui/float"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  area: { position: "relative", minBlockSize: "8rem", padding: "2rem" },
})

export function Preview() {
  return (
    <Box xstyle={styles.area}>
      Notification card<Float>New</Float>
    </Box>
  )
}

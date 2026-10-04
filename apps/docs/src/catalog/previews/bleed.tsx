"use client"

import { Bleed } from "@registry/components/ui/bleed"
import { Box } from "@registry/components/ui/box"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ area: { paddingInline: "2rem" } })

export function Preview() {
  return (
    <Box xstyle={styles.area}>
      <Bleed>Full-width content in a padded section</Bleed>
    </Box>
  )
}

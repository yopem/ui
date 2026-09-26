"use client"

import { Bleed } from "@registry/components/ui/bleed"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ area: { paddingInline: "2rem" } })

export function Preview() {
  return (
    <div {...stylex.props(styles.area)}>
      <Bleed>Full-width content in a padded section</Bleed>
    </div>
  )
}

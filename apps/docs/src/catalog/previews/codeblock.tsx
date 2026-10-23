"use client"

import { Codeblock } from "@registry/components/ui/codeblock"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  codeblock: {
    contain: "inline-size",
    inlineSize: "min(40rem, 100%)",
  },
})

export function Preview() {
  return (
    <Codeblock xstyle={styles.codeblock}>
      {
        'const station = { name: "Willow Creek", region: "North Ridge", equipment: ["weather sensor", "field camera", "water sampler"] }'
      }
    </Codeblock>
  )
}

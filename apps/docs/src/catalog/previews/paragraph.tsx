import * as stylex from "@stylexjs/stylex"

import { Paragraph } from "@/components/ui/paragraph"
const styles = stylex.create({ paragraph: { maxInlineSize: "60ch" } })

export function Preview() {
  return (
    <Paragraph xstyle={styles.paragraph}>
      Paragraph keeps body copy in a native p element.
    </Paragraph>
  )
}

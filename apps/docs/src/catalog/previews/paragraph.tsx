import { Paragraph } from "@registry/components/ui/paragraph"
import * as stylex from "@stylexjs/stylex"
const styles = stylex.create({ paragraph: { maxInlineSize: "60ch" } })

export function Preview() {
  return (
    <Paragraph xstyle={styles.paragraph}>
      Paragraph keeps body copy in a native p element.
    </Paragraph>
  )
}

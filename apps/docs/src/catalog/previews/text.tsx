import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ text: { maxInlineSize: "60ch" } })

export function Preview() {
  return (
    <Text xstyle={styles.text}>
      The east trail follows the river for two kilometers.
    </Text>
  )
}

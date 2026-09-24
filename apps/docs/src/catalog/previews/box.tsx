import { Box } from "@registry/components/ui/box"
import * as stylex from "@stylexjs/stylex"
const styles = stylex.create({
  section: {
    paddingBlock: "calc(var(--spacing) * 4)",
    paddingInline: "calc(var(--spacing) * 4)",
  },
})

export function Preview() {
  return (
    <Box as="section" xstyle={styles.section}>
      Content inside a semantic Box.
    </Box>
  )
}

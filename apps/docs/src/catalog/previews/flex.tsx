import { Box } from "@registry/components/ui/box"
import { Flex } from "@registry/components/ui/flex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  flex: { alignItems: "center", gap: "calc(var(--spacing) * 4)" },
})

export function Preview() {
  return (
    <Flex xstyle={styles.flex}>
      <Box as="span">First</Box>
      <Box as="span">Second</Box>
    </Flex>
  )
}

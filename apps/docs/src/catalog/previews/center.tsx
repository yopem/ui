import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Center } from "@/components/ui/center"
const styles = stylex.create({ center: { minBlockSize: "8rem" } })

export function Preview() {
  return (
    <Center xstyle={styles.center}>
      <Box as="span">Centered content</Box>
    </Center>
  )
}

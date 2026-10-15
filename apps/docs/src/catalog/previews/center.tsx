import { Box } from "@registry/components/ui/box"
import { Center } from "@registry/components/ui/center"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ center: { minBlockSize: "8rem" } })

export function Preview() {
  return (
    <Center xstyle={styles.center}>
      <Box render={<span />}>No observations selected</Box>
    </Center>
  )
}

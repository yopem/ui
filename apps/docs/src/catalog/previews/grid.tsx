import { Box } from "@registry/components/ui/box"
import { Grid } from "@registry/components/ui/grid"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "calc(var(--spacing) * 4)",
  },
})

export function Preview() {
  return (
    <Grid xstyle={styles.grid}>
      <Box render={<span />}>Design</Box>
      <Box render={<span />}>Engineering</Box>
    </Grid>
  )
}

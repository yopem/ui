import { Box } from "@/components/ui/stylex/box"
import { Grid } from "@/components/ui/stylex/grid"

export function Example() {
  return (
    <Grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={4}>
      <Box as="span">Design</Box>
      <Box as="span">Engineering</Box>
    </Grid>
  )
}

import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"

export function Preview() {
  return (
    <Grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={4}>
      <Box as="span">Design</Box>
      <Box as="span">Engineering</Box>
    </Grid>
  )
}

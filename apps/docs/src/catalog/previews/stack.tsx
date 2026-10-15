import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"

export function Preview() {
  return (
    <Stack>
      <Box render={<strong />}>Equipment status</Box>
      <Box render={<span />}>All loan kits have been checked.</Box>
    </Stack>
  )
}

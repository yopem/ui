import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"

export function Preview() {
  return (
    <Stack>
      <Box render={<strong />}>Project status</Box>
      <Box render={<span />}>All systems operational.</Box>
    </Stack>
  )
}

import { Box } from "@registry/components/ui/box"
import { Stack } from "@registry/components/ui/stack"

export function Preview() {
  return (
    <Stack>
      <Box as="strong">Project status</Box>
      <Box as="span">All systems operational.</Box>
    </Stack>
  )
}

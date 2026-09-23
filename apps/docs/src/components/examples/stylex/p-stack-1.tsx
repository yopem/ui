import { Box } from "@/components/ui/box"
import { Stack } from "@/components/ui/stack"

export function Example() {
  return (
    <Stack>
      <Box as="strong">Project status</Box>
      <Box as="span">All systems operational.</Box>
    </Stack>
  )
}

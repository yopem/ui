import { Box } from "@/components/ui/stylex/box"
import { Stack } from "@/components/ui/stylex/stack"

export function Example() {
  return (
    <Stack>
      <Box as="strong">Project status</Box>
      <Box as="span">All systems operational.</Box>
    </Stack>
  )
}

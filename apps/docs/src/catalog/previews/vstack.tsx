import { Box } from "@registry/components/ui/box"
import { VStack } from "@registry/components/ui/vstack"

export function Preview() {
  return (
    <VStack>
      <Box render={<strong />}>Account ready</Box>
      <Box render={<span />}>Nothing else is needed.</Box>
    </VStack>
  )
}

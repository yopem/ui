import { Box } from "@registry/components/ui/box"
import { VStack } from "@registry/components/ui/vstack"

export function Preview() {
  return (
    <VStack>
      <Box render={<strong />}>Kit ready</Box>
      <Box render={<span />}>Collect it at the station desk.</Box>
    </VStack>
  )
}

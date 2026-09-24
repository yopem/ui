import { Box } from "@registry/components/ui/box"
import { VStack } from "@registry/components/ui/vstack"

export function Preview() {
  return (
    <VStack>
      <Box as="strong">Account ready</Box>
      <Box as="span">Nothing else is needed.</Box>
    </VStack>
  )
}

import { Box } from "@/components/ui/box"
import { VStack } from "@/components/ui/vstack"

export function Example() {
  return (
    <VStack>
      <Box as="strong">Account ready</Box>
      <Box as="span">Nothing else is needed.</Box>
    </VStack>
  )
}

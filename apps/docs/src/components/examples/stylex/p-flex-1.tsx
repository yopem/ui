import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"

export function Example() {
  return (
    <Flex alignItems="center" gap={4}>
      <Box as="span">First</Box>
      <Box as="span">Second</Box>
    </Flex>
  )
}

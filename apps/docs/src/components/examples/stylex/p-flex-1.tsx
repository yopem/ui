import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"

export function Example() {
  return (
    <Flex alignItems="center" gap={4}>
      <Box as="span">First</Box>
      <Box as="span">Second</Box>
    </Flex>
  )
}

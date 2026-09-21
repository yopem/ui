import { Box } from "@/components/ui/stylex/box"
import { HStack } from "@/components/ui/stylex/hstack"

export function Example() {
  return (
    <HStack>
      <Box as="span">Inbox</Box>
      <Box as="span" aria-label="unread messages">
        3
      </Box>
    </HStack>
  )
}

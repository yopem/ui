import { Box } from "@/components/ui/box"
import { HStack } from "@/components/ui/hstack"

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

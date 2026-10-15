import { Box } from "@registry/components/ui/box"
import { HStack } from "@registry/components/ui/hstack"

export function Preview() {
  return (
    <HStack>
      <Box render={<span />}>Station messages</Box>
      <Box render={<span />} aria-label="unread messages">
        3
      </Box>
    </HStack>
  )
}

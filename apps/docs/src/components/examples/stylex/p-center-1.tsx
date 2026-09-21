import { Box } from "@/components/ui/stylex/box"
import { Center } from "@/components/ui/stylex/center"

export function Example() {
  return (
    <Center minBlockSize="8rem">
      <Box as="span">Centered content</Box>
    </Center>
  )
}

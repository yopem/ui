import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Button } from "@/components/ui/stylex/button"
import { Flex } from "@/components/ui/stylex/flex"
import { Input } from "@/components/ui/stylex/input"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Input
        aria-label="Email"
        {...stylex.props(exampleStyles.example2)}
        placeholder="you@example.com"
        type="email"
      />
      <Box>
        <Button variant="outline">Send</Button>
      </Box>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
    inlineSize: "calc(0.25rem * 75)",
  },
  example2: {
    flex: "1",
  },
})

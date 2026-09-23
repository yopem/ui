import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Textarea } from "@/components/ui/textarea"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Textarea placeholder="Type your message here" />
      <Button {...stylex.props(exampleStyles.example2)}>Send</Button>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    alignSelf: "flex-end",
  },
})

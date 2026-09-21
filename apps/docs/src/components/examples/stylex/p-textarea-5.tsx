import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Flex } from "@/components/ui/stylex/flex"
import { Label } from "@/components/ui/stylex/label"
import { Textarea } from "@/components/ui/stylex/textarea"
export default function Example() {
  const id = useId()
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Label htmlFor={id}>Message</Label>
      <Textarea id={id} placeholder="Type your message here" />
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
  },
})

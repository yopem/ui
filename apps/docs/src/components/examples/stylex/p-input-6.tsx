import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Flex } from "@/components/ui/flex"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export default function Example() {
  const id = useId()
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Label htmlFor={id}>Email</Label>
      <Input
        aria-label="Email"
        id={id}
        placeholder="you@example.com"
        type="email"
      />
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

import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export default function Example() {
  const id = useId()
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Label htmlFor={id}>
        Email{" "}
        <Box as="span" {...stylex.props(exampleStyles.example2)}>
          *
        </Box>
      </Label>
      <Input id={id} placeholder="Email" required type="email" />
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
    color: "var(--destructive)",
  },
})

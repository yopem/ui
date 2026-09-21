import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { Input } from "@/components/ui/stylex/input"
import { Label } from "@/components/ui/stylex/label"
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

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
      <Flex xstyle={exampleStyles.example2}>
        <Label htmlFor={id}>Email</Label>
        <Label
          render={<Box as="span" />}
          {...stylex.props(exampleStyles.optional)}
        >
          Optional
        </Label>
      </Flex>
      <Input id={id} placeholder="Email" type="email" />
    </Flex>
  )
}

const exampleStyles = stylex.create({
  optional: { color: "var(--muted-foreground)", fontWeight: 400 },
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    display: "inline-flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})

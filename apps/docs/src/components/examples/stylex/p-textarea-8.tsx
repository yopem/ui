import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Box } from "@/components/ui/stylex/box"
import { Flex } from "@/components/ui/stylex/flex"
import { Label } from "@/components/ui/stylex/label"
import { Textarea } from "@/components/ui/stylex/textarea"
export default function Example() {
  const id = useId()
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Flex xstyle={exampleStyles.example2}>
        <Label htmlFor={id}>Message</Label>
        <Label
          {...stylex.props(exampleStyles.example3)}
          render={<Box as="span" />}
        >
          Optional
        </Label>
      </Flex>
      <Textarea id={id} placeholder="Type your message here" />
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
    display: "inline-flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    fontWeight: "400",
    color: "var(--muted-foreground)",
  },
})

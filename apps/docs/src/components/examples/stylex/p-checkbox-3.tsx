import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Flex } from "@/components/ui/flex"
import { Label } from "@/components/ui/label"
import { Paragraph } from "@/components/ui/paragraph"
export default function Example() {
  const id = useId()

  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Checkbox defaultChecked id={id} />
      <Flex {...stylex.props(exampleStyles.example2)}>
        <Label htmlFor={id}>Accept terms and conditions</Label>
        <Paragraph {...stylex.props(exampleStyles.example3)}>
          By clicking this checkbox, you agree to the terms and conditions.
        </Paragraph>
      </Flex>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example3: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})

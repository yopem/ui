import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Flex } from "@/components/ui/flex"
import { Label } from "@/components/ui/label"
import { Paragraph } from "@/components/ui/paragraph"
import { Switch } from "@/components/ui/switch"
export default function Example() {
  const id = useId()

  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Switch defaultChecked id={id} />
      <Flex {...stylex.props(exampleStyles.example2)}>
        <Label htmlFor={id}>Marketing emails</Label>
        <Paragraph {...stylex.props(exampleStyles.example3)}>
          By enabling marketing emails, you agree to receive emails.
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

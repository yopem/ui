import * as stylex from "@stylexjs/stylex"

import { Flex } from "@/components/ui/flex"
import { Label } from "@/components/ui/label"
import { Paragraph } from "@/components/ui/paragraph"
import { Radio, RadioGroup } from "@/components/ui/radio-group"
export default function Example() {
  return (
    <RadioGroup defaultValue="r-1">
      <Flex {...stylex.props(exampleStyles.example1)}>
        <Radio id="r-1" value="r-1" />
        <Flex {...stylex.props(exampleStyles.example2)}>
          <Label htmlFor="r-1">Free</Label>
          <Paragraph {...stylex.props(exampleStyles.example3)}>
            Basic features for personal use.
          </Paragraph>
        </Flex>
      </Flex>
      <Flex {...stylex.props(exampleStyles.example1)}>
        <Radio id="r-2" value="r-2" />
        <Flex {...stylex.props(exampleStyles.example2)}>
          <Label htmlFor="r-2">Pro</Label>
          <Paragraph {...stylex.props(exampleStyles.example3)}>
            Advanced tools for professionals.
          </Paragraph>
        </Flex>
      </Flex>
    </RadioGroup>
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

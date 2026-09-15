import * as stylex from "@stylexjs/stylex"

import { Label } from "@/components/ui/stylex/label"
import { Radio, RadioGroup } from "@/components/ui/stylex/radio-group"

export default function Example() {
  return (
    <RadioGroup defaultValue="r-1">
      <div {...stylex.props(exampleStyles.example1)}>
        <Radio id="r-1" value="r-1" />
        <div {...stylex.props(exampleStyles.example2)}>
          <Label htmlFor="r-1">Free</Label>
          <p {...stylex.props(exampleStyles.example3)}>
            Basic features for personal use.
          </p>
        </div>
      </div>
      <div {...stylex.props(exampleStyles.example1)}>
        <Radio id="r-2" value="r-2" />
        <div {...stylex.props(exampleStyles.example2)}>
          <Label htmlFor="r-2">Pro</Label>
          <p {...stylex.props(exampleStyles.example3)}>
            Advanced tools for professionals.
          </p>
        </div>
      </div>
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

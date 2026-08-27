import * as stylex from "@stylexjs/stylex"

import { Label } from "@/components/ui/stylex/label"
import { Radio, RadioGroup } from "@/components/ui/stylex/radio-group"

export default function Particle() {
  return (
    <RadioGroup defaultValue="r-1">
      <div {...stylex.props(demoStyles.demo1)}>
        <Radio id="r-1" value="r-1" />
        <div {...stylex.props(demoStyles.demo2)}>
          <Label htmlFor="r-1">Free</Label>
          <p {...stylex.props(demoStyles.demo3)}>
            Basic features for personal use.
          </p>
        </div>
      </div>
      <div {...stylex.props(demoStyles.demo1)}>
        <Radio id="r-2" value="r-2" />
        <div {...stylex.props(demoStyles.demo2)}>
          <Label htmlFor="r-2">Pro</Label>
          <p {...stylex.props(demoStyles.demo3)}>
            Advanced tools for professionals.
          </p>
        </div>
      </div>
    </RadioGroup>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  demo3: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})

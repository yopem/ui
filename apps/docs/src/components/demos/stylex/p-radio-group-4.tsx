import * as stylex from "@stylexjs/stylex"

import { Label } from "@/components/ui/stylex/label"
import { Radio, RadioGroup } from "@/components/ui/stylex/radio-group"

export default function Particle() {
  return (
    <RadioGroup defaultValue="r-1">
      <Label {...stylex.props(demoStyles.report1)}>
        <Radio {...stylex.props(stylex.defaultMarker())} value="r-1" />
        <div {...stylex.props(demoStyles.demo1)}>
          <p>Email</p>
          <p {...stylex.props(demoStyles.demo2)}>
            Receive notifications via email.
          </p>
        </div>
      </Label>
      <Label {...stylex.props(demoStyles.report2)}>
        <Radio {...stylex.props(stylex.defaultMarker())} value="r-2" />
        <div {...stylex.props(demoStyles.demo1)}>
          <p>SMS</p>
          <p {...stylex.props(demoStyles.demo2)}>
            Receive notifications via text message.
          </p>
        </div>
      </Label>
    </RadioGroup>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  demo2: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  report1: {
    display: "flex",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    padding: "calc(0.25rem * 3)",
    backgroundColor: {
      default: null,
      ":hover": "color-mix(in oklab, var(--accent) 50%, transparent)",
      [stylex.when.descendant("[data-checked]")]:
        "color-mix(in oklab, var(--accent) 50%, transparent)",
    },
    borderColor: {
      default: "var(--border)",
      [stylex.when.descendant("[data-checked]")]:
        "color-mix(in oklab, var(--primary) 48%, transparent)",
    },
  },
  report2: {
    display: "flex",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    padding: "calc(0.25rem * 3)",
    backgroundColor: {
      default: null,
      ":hover": "color-mix(in oklab, var(--accent) 50%, transparent)",
      [stylex.when.descendant("[data-checked]")]:
        "color-mix(in oklab, var(--accent) 50%, transparent)",
    },
    borderColor: {
      default: "var(--border)",
      [stylex.when.descendant("[data-checked]")]:
        "color-mix(in oklab, var(--primary) 48%, transparent)",
    },
  },
})

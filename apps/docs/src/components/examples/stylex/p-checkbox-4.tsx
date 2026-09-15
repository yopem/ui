import * as stylex from "@stylexjs/stylex"

import { Checkbox } from "@/components/ui/stylex/checkbox"
import { Label } from "@/components/ui/stylex/label"

export default function Particle() {
  return (
    <Label {...stylex.props(exampleStyles.report1)}>
      <Checkbox {...stylex.props(stylex.defaultMarker())} defaultChecked />
      <div {...stylex.props(exampleStyles.example1)}>
        <p>Enable notifications</p>
        <p {...stylex.props(exampleStyles.example2)}>
          You can enable or disable notifications at any time.
        </p>
      </div>
    </Label>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example2: {
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
})

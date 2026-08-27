import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Switch } from "@/components/ui/stylex/switch"

export default function Particle() {
  const id = useId()

  return (
    <Label {...stylex.props(demoStyles.report1)} htmlFor={id}>
      <div {...stylex.props(demoStyles.demo1)}>
        <p>Enable notifications</p>
        <p {...stylex.props(demoStyles.demo2)}>
          You can enable or disable notifications at any time.
        </p>
      </div>
      <Switch
        {...stylex.props(demoStyles.report2Manual, stylex.defaultMarker())}
        defaultChecked
        id={id}
      />
    </Label>
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
    alignItems: "center",
    gap: "calc(0.25rem * 6)",
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
  report2Manual: {
    "--thumb-size": {
      default: "1rem",
      "@media (min-width: 640px)": "0.75rem",
    },
  },
})

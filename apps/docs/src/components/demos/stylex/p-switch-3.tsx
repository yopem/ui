import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Switch } from "@/components/ui/stylex/switch"

export default function Particle() {
  const id = useId()

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Switch defaultChecked id={id} />
      <div {...stylex.props(demoStyles.demo2)}>
        <Label htmlFor={id}>Marketing emails</Label>
        <p {...stylex.props(demoStyles.demo3)}>
          By enabling marketing emails, you agree to receive emails.
        </p>
      </div>
    </div>
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

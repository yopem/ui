import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Switch } from "@/components/ui/stylex/switch"

export default function Particle() {
  const id = useId()

  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Switch defaultChecked id={id} />
      <div {...stylex.props(exampleStyles.example2)}>
        <Label htmlFor={id}>Marketing emails</Label>
        <p {...stylex.props(exampleStyles.example3)}>
          By enabling marketing emails, you agree to receive emails.
        </p>
      </div>
    </div>
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

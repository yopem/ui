import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Input } from "@/components/ui/stylex/input"
import { Label } from "@/components/ui/stylex/label"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <div {...stylex.props(demoStyles.demo2)}>
        <Label htmlFor={id}>Email</Label>
        <Label render={<span />} {...stylex.props(demoStyles.optional)}>
          Optional
        </Label>
      </div>
      <Input id={id} placeholder="Email" type="email" />
    </div>
  )
}

const demoStyles = stylex.create({
  optional: { color: "var(--muted-foreground)", fontWeight: 400 },
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    display: "inline-flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
})

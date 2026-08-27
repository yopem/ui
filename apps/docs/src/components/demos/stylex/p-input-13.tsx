import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Input } from "@/components/ui/stylex/input"
import { Label } from "@/components/ui/stylex/label"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Label htmlFor={id}>
        Email <span {...stylex.props(demoStyles.demo2)}>*</span>
      </Label>
      <Input id={id} placeholder="Email" required type="email" />
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    color: "var(--destructive)",
  },
})

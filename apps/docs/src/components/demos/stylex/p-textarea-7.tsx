import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Label htmlFor={id}>
        Message <span {...stylex.props(demoStyles.demo2)}>*</span>
      </Label>
      <Textarea id={id} placeholder="Type your message here" required />
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

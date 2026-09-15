import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Label htmlFor={id}>
        Message <span {...stylex.props(exampleStyles.example2)}>*</span>
      </Label>
      <Textarea id={id} placeholder="Type your message here" required />
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    color: "var(--destructive)",
  },
})

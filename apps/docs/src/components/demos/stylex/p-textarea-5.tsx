import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Label htmlFor={id}>Message</Label>
      <Textarea id={id} placeholder="Type your message here" />
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
  },
})

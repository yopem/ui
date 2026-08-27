import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <div {...stylex.props(demoStyles.demo2)}>
        <Label htmlFor={id}>Message</Label>
        <Label {...stylex.props(demoStyles.demo3)} render={<span />}>
          Optional
        </Label>
      </div>
      <Textarea id={id} placeholder="Type your message here" />
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
    display: "inline-flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
  demo3: {
    fontWeight: "400",
    color: "var(--muted-foreground)",
  },
})

import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <div {...stylex.props(exampleStyles.example2)}>
        <Label htmlFor={id}>Message</Label>
        <Label {...stylex.props(exampleStyles.example3)} render={<span />}>
          Optional
        </Label>
      </div>
      <Textarea id={id} placeholder="Type your message here" />
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
    display: "inline-flex",
    inlineSize: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    fontWeight: "400",
    color: "var(--muted-foreground)",
  },
})

import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Textarea placeholder="Type your message here" />
      <Button {...stylex.props(demoStyles.demo2)}>Send</Button>
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
    alignSelf: "flex-start",
  },
})

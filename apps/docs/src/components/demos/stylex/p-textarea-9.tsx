import * as stylex from "@stylexjs/stylex"

import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  return (
    <Textarea
      aria-label="Message"
      {...stylex.props(demoStyles.demo1)}
      placeholder="Type your message here"
    />
  )
}

const demoStyles = stylex.create({
  demo1: {
    borderColor: "transparent",
    backgroundColor: "var(--muted)",
    boxShadow: "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000",
    "::before": {
      content: '""',
      display: "none",
    },
  },
})

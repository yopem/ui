import * as stylex from "@stylexjs/stylex"

import { Textarea } from "@/components/ui/textarea"

export default function Example() {
  return (
    <Textarea
      aria-label="Message"
      {...stylex.props(exampleStyles.example1)}
      placeholder="Type your message here"
    />
  )
}

const exampleStyles = stylex.create({
  example1: {
    borderColor: "transparent",
    backgroundColor: "var(--muted)",
    boxShadow: "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000",
    "::before": {
      content: '""',
      display: "none",
    },
  },
})

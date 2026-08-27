import * as stylex from "@stylexjs/stylex"

import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  return (
    <Textarea
      {...stylex.props(demoStyles.report1)}
      placeholder="Type your message here"
      rows={2}
    />
  )
}

const demoStyles = stylex.create({
  report1: {
    fieldSizing: "fixed",
    minBlockSize: 0,
  },
})

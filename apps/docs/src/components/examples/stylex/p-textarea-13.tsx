import * as stylex from "@stylexjs/stylex"

import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  return (
    <Textarea
      {...stylex.props(exampleStyles.report1)}
      placeholder="Type your message here"
      rows={2}
    />
  )
}

const exampleStyles = stylex.create({
  report1: {
    fieldSizing: "fixed",
    minBlockSize: 0,
  },
})

import * as stylex from "@stylexjs/stylex"

import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <Input
      aria-label="Enter text"
      {...stylex.props(exampleStyles.report1Manual)}
      placeholder="Enter text"
      type="text"
    />
  )
}

const exampleStyles = stylex.create({
  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999px",
    borderRadius: "9999px",
  },
})

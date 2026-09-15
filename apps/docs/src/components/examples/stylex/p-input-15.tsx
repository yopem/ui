import * as stylex from "@stylexjs/stylex"

import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <Input
      aria-label="Email"
      {...stylex.props(exampleStyles.example1)}
      placeholder="Email"
      type="email"
    />
  )
}

const exampleStyles = stylex.create({
  example1: {
    "--input-control-background": "var(--muted)",
    "--input-control-before-display": "none",
    "--input-control-border": "transparent",
    "--input-control-shadow":
      "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000",
  },
})

import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "inline-flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
})

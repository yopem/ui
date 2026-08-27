import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "inline-flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
})

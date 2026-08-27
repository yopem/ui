import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Input
        aria-label="Email"
        {...stylex.props(demoStyles.demo2)}
        placeholder="you@example.com"
        type="email"
      />
      <div>
        <Button variant="outline">Send</Button>
      </div>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
    inlineSize: "calc(0.25rem * 75)",
  },
  demo2: {
    flex: "1",
  },
})

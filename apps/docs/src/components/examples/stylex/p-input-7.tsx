import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Input
        aria-label="Email"
        {...stylex.props(exampleStyles.example2)}
        placeholder="you@example.com"
        type="email"
      />
      <div>
        <Button variant="outline">Send</Button>
      </div>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
    inlineSize: "calc(0.25rem * 75)",
  },
  example2: {
    flex: "1",
  },
})

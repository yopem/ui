import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"

export default function Particle() {
  return (
    <Badge variant="outline">
      <span aria-hidden="true" {...stylex.props(demoStyles.demo1)} />
      Pending
    </Badge>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
})

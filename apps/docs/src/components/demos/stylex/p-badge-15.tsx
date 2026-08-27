import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"

export default function Particle() {
  return (
    <Badge variant="outline">
      Notifications
      <span {...stylex.props(demoStyles.demo1)}>5</span>
    </Badge>
  )
}

const demoStyles = stylex.create({
  demo1: {
    marginInlineStart: "0.25rem",
    fontWeight: "600",
    color: "var(--primary)",
  },
})

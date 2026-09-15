import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"

export default function Example() {
  return (
    <Badge variant="outline">
      Notifications
      <span {...stylex.props(exampleStyles.example1)}>5</span>
    </Badge>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginInlineStart: "0.25rem",
    fontWeight: "600",
    color: "var(--primary)",
  },
})

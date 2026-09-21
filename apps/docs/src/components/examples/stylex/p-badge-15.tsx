import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"
import { Box } from "@/components/ui/stylex/box"
export default function Example() {
  return (
    <Badge variant="outline">
      Notifications
      <Box as="span" {...stylex.props(exampleStyles.example1)}>
        5
      </Box>
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

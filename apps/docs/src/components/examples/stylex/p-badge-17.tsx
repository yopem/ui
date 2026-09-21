import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"
import { Box } from "@/components/ui/stylex/box"
export default function Example() {
  return (
    <Badge variant="outline">
      <Box
        as="span"
        aria-hidden="true"
        {...stylex.props(exampleStyles.example1)}
      />
      Pending
    </Badge>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(76.9% 0.188 70.08)",
  },
})

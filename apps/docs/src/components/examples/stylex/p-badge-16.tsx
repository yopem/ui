import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"

export default function Example() {
  return (
    <Badge variant="outline">
      <span aria-hidden="true" {...stylex.props(exampleStyles.example1)} />
      Paid
    </Badge>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "calc(0.25rem * 1.5)",
    blockSize: "calc(0.25rem * 1.5)",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "oklch(69.6% 0.17 162.48)",
  },
})

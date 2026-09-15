import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"

export default function Example() {
  return (
    <Button variant="outline">
      Messages
      <Badge {...stylex.props(exampleStyles.example1)} variant="outline">
        18
      </Badge>
    </Button>
  )
}

const exampleStyles = stylex.create({
  example1: {
    marginInlineEnd: "calc(0.25rem * -1)",
  },
})

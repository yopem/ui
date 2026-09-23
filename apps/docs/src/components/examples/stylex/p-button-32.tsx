import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

import * as stylex from "@stylexjs/stylex"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button variant="outline">
      Messages
      <Badge {...stylex.props(demoStyles.demo1)} variant="outline">
        18
      </Badge>
    </Button>
  )
}

const demoStyles = stylex.create({
  demo1: {
    marginInlineEnd: "calc(0.25rem * -1)",
  },
})

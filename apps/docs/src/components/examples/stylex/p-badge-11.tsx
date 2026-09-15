import * as stylex from "@stylexjs/stylex"
import { CheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/stylex/badge"

export default function Example() {
  return (
    <Badge variant="outline">
      <CheckIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
      Verified
    </Badge>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    inlineSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
})

import * as stylex from "@stylexjs/stylex"
import { BoldIcon } from "lucide-react"

import { Toggle } from "@/components/ui/stylex/toggle"

export default function Particle() {
  return (
    <Toggle aria-label="Toggle bold" variant="outline">
      <BoldIcon {...stylex.props(exampleStyles.icon)} />
    </Toggle>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
})

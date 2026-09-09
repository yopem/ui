import * as stylex from "@stylexjs/stylex"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button variant="link">
      <ChevronLeftIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
      Go back
    </Button>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})

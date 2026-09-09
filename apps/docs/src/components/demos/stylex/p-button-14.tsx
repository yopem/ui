import * as stylex from "@stylexjs/stylex"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button aria-label="Add" size="icon-sm">
      <PlusIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
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

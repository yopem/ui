import * as stylex from "@stylexjs/stylex"
import { PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Kbd, KbdGroup } from "@/components/ui/stylex/kbd"

export default function Particle() {
  return (
    <Button variant="outline">
      <PrinterIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
      Print
      <KbdGroup {...stylex.props(demoStyles.demo1)}>
        <Kbd>&#8984;</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
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
  demo1: {
    marginInlineEnd: "calc(0.25rem * -1)",
  },
})

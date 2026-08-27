import * as stylex from "@stylexjs/stylex"
import { PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Kbd, KbdGroup } from "@/components/ui/stylex/kbd"

export default function Particle() {
  return (
    <Button variant="outline">
      <PrinterIcon aria-hidden="true" />
      Print
      <KbdGroup {...stylex.props(demoStyles.demo1)}>
        <Kbd>&#8984;</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
    </Button>
  )
}

const demoStyles = stylex.create({
  demo1: {
    marginInlineEnd: "calc(0.25rem * -1)",
  },
})

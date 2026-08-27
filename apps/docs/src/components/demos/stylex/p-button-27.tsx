import * as stylex from "@stylexjs/stylex"
import { QrCodeIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"

export default function Particle() {
  return (
    <Group>
      <Button aria-label="QR code" size="icon">
        <QrCodeIcon aria-hidden="true" />
      </Button>
      <GroupSeparator {...stylex.props(demoStyles.demo1)} />
      <Button>Sign in</Button>
    </Group>
  )
}

const demoStyles = stylex.create({
  demo1: {
    backgroundColor: {
      default: "var(--primary)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary) 72%, transparent)",
    },
  },
})

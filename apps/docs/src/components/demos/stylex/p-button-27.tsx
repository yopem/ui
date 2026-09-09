import * as stylex from "@stylexjs/stylex"
import { QrCodeIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  groupItemStyles,
  Group,
  GroupSeparator,
} from "@/components/ui/stylex/group"

export default function Particle() {
  return (
    <Group>
      <Button xstyle={groupItemStyles.item} aria-label="QR code" size="icon">
        <QrCodeIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
      </Button>
      <GroupSeparator {...stylex.props(demoStyles.demo1)} />
      <Button xstyle={groupItemStyles.item}>Sign in</Button>
    </Group>
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
    backgroundColor: {
      default: "var(--primary)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary) 72%, transparent)",
    },
  },
})

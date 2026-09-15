import * as stylex from "@stylexjs/stylex"
import { ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Group,
  GroupSeparator,
  groupItemStyles,
} from "@/components/ui/stylex/group"

export default function Particle() {
  return (
    <Group aria-label="Zoom controls" orientation="vertical">
      <Button
        aria-label="Zoom in"
        size="icon"
        variant="outline"
        xstyle={groupItemStyles.item}
      >
        <ZoomInIcon {...stylex.props(exampleStyles.icon)} />
      </Button>
      <GroupSeparator orientation="horizontal" />
      <Button
        aria-label="Zoom Out"
        size="icon"
        variant="outline"
        xstyle={groupItemStyles.item}
      >
        <ZoomOutIcon {...stylex.props(exampleStyles.icon)} />
      </Button>
    </Group>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})

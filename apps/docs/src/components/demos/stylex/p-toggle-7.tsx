import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import { Toggle } from "@/components/ui/stylex/toggle"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Toggle aria-label="Toggle bold" variant="outline">
        <BoldIcon {...stylex.props(demoStyles.icon)} />
      </Toggle>
      <Toggle aria-label="Toggle italic" variant="outline">
        <ItalicIcon {...stylex.props(demoStyles.icon)} />
      </Toggle>
      <Toggle aria-label="Toggle underline" variant="outline">
        <UnderlineIcon {...stylex.props(demoStyles.icon)} />
      </Toggle>
    </div>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  demo1: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
})

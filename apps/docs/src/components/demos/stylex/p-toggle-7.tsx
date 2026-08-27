import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import { Toggle } from "@/components/ui/stylex/toggle"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Toggle aria-label="Toggle bold" variant="outline">
        <BoldIcon />
      </Toggle>
      <Toggle aria-label="Toggle italic" variant="outline">
        <ItalicIcon />
      </Toggle>
      <Toggle aria-label="Toggle underline" variant="outline">
        <UnderlineIcon />
      </Toggle>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
})

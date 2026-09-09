import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupSeparator,
} from "@/components/ui/stylex/toggle-group"

export default function Particle() {
  return (
    <ToggleGroup defaultValue={["bold"]} variant="outline">
      <ToggleGroupItem aria-label="Toggle bold" value="bold">
        <BoldIcon {...stylex.props(demoStyles.icon)} />
      </ToggleGroupItem>
      <ToggleGroupSeparator />
      <ToggleGroupItem aria-label="Toggle italic" value="italic">
        <ItalicIcon {...stylex.props(demoStyles.icon)} />
      </ToggleGroupItem>
      <ToggleGroupSeparator />
      <ToggleGroupItem aria-label="Toggle underline" value="underline">
        <UnderlineIcon {...stylex.props(demoStyles.icon)} />
      </ToggleGroupItem>
    </ToggleGroup>
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
})

import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function Example() {
  return (
    <ToggleGroup defaultValue={["bold"]} size="lg">
      <ToggleGroupItem aria-label="Toggle bold" value="bold">
        <BoldIcon {...stylex.props(exampleStyles.icon)} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Toggle italic" value="italic">
        <ItalicIcon {...stylex.props(exampleStyles.icon)} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Toggle underline" value="underline">
        <UnderlineIcon {...stylex.props(exampleStyles.icon)} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
})

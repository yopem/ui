import {
  ToggleGroup,
  ToggleGroupItem,
} from "@registry/components/ui/toggle-group"
import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

export function Preview() {
  return (
    <ToggleGroup defaultValue={["bold"]}>
      <ToggleGroupItem aria-label="Toggle bold" value="bold">
        <BoldIcon {...stylex.props(previewStyles.icon)} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Toggle italic" value="italic">
        <ItalicIcon {...stylex.props(previewStyles.icon)} />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Toggle underline" value="underline">
        <UnderlineIcon {...stylex.props(previewStyles.icon)} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

const previewStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
})

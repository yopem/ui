import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/stylex/toggle-group"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

const formats = [
  { Icon: BoldIcon, label: "Bold", value: "bold" },
  { Icon: ItalicIcon, label: "Italic", value: "italic" },
  { Icon: UnderlineIcon, label: "Underline", value: "underline" },
]

export default function Example() {
  return (
    <TooltipProvider>
      <ToggleGroup defaultValue={["bold"]} multiple>
        {formats.map(({ Icon, label, value }) => (
          <Tooltip key={value}>
            <TooltipTrigger
              render={
                <ToggleGroupItem aria-label={`Toggle ${value}`} value={value} />
              }
            >
              <Icon {...stylex.props(exampleStyles.icon)} />
            </TooltipTrigger>
            <TooltipPopup>{label}</TooltipPopup>
          </Tooltip>
        ))}
      </ToggleGroup>
    </TooltipProvider>
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

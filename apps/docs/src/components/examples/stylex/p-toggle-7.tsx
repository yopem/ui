import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import { Flex } from "@/components/ui/stylex/flex"
import { Toggle } from "@/components/ui/stylex/toggle"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Toggle aria-label="Toggle bold" variant="outline">
        <BoldIcon {...stylex.props(exampleStyles.icon)} />
      </Toggle>
      <Toggle aria-label="Toggle italic" variant="outline">
        <ItalicIcon {...stylex.props(exampleStyles.icon)} />
      </Toggle>
      <Toggle aria-label="Toggle underline" variant="outline">
        <UnderlineIcon {...stylex.props(exampleStyles.icon)} />
      </Toggle>
    </Flex>
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
  example1: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
})

import * as stylex from "@stylexjs/stylex"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import { Spinner } from "@/components/ui/stylex/spinner"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput disabled placeholder="Searching…" type="search" />
      <InputGroupAddon align="inline-end">
        <Spinner {...stylex.props(demoStyles.icon)} />
      </InputGroupAddon>
    </InputGroup>
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

import * as stylex from "@stylexjs/stylex"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Subscribe to our newsletter"
        disabled
        placeholder="Your best email"
        type="email"
      />
      <InputGroupAddon align="inline-end">
        <Button aria-label="Subscribe" disabled size="icon-xs" variant="ghost">
          <ArrowRightIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})

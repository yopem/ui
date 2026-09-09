import * as stylex from "@stylexjs/stylex"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/stylex/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>Subscribe</FieldLabel>
      <InputGroup>
        <InputGroupInput placeholder="Your best email" type="email" />
        <InputGroupAddon align="inline-end">
          <Button aria-label="Subscribe" size="icon-xs" variant="ghost">
            <ArrowRightIcon
              {...stylex.props(demoStyles.icon)}
              aria-hidden="true"
            />
          </Button>
        </InputGroupAddon>
      </InputGroup>
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})

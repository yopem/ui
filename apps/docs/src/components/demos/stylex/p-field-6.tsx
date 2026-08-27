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
    <>
      <style>{demoCss}</style>
      <Field>
        <FieldLabel>Subscribe</FieldLabel>
        <InputGroup>
          <InputGroupInput placeholder="Your best email" type="email" />
          <InputGroupAddon align="inline-end">
            <Button aria-label="Subscribe" size="icon-xs" variant="ghost">
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <FieldError>Please enter a valid email address.</FieldError>
      </Field>
    </>
  )
}

const demoCss = `
  [data-slot="input-group"]::before {
    border-radius: calc(var(--radius-lg) - 1px);
    box-shadow: 0 1px rgb(0 0 0 / 4%);
    content: "";
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  [data-theme="dark"] [data-slot="input-group"]::before {
    box-shadow: 0 -1px rgb(255 255 255 / 6%);
  }
  [data-slot="input-group"] [data-slot="input"] { padding-inline-end: 0.5rem; }
  [data-slot="input-group-addon"] { margin-inline-end: -0.5rem; }
  [data-slot="input-group-addon"] svg { block-size: 1.125rem; inline-size: 1.125rem; }
  @media (min-width: 640px) {
    [data-slot="input-group"] { line-height: 1.25rem; }
    [data-slot="input-group-addon"] svg { block-size: 1rem; inline-size: 1rem; }
  }
`

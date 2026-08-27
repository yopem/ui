"use client"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  return (
    <>
      <style>{demoCss}</style>
      <Field>
        <FieldLabel>Bio</FieldLabel>
        <Textarea placeholder="Tell us about yourself…" />
        <FieldDescription>
          Write a short bio. Maximum 500 characters.
        </FieldDescription>
      </Field>
    </>
  )
}

const demoCss = `
  [data-slot="textarea-control"]::before {
    border-radius: calc(var(--radius-lg) - 1px);
    box-shadow: 0 1px rgb(0 0 0 / 4%);
    content: "";
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  [data-theme="dark"] [data-slot="textarea-control"]::before {
    box-shadow: 0 -1px rgb(255 255 255 / 6%);
  }
  [data-slot="textarea"] { border-radius: inherit; }
  @media (min-width: 640px) {
    [data-slot="textarea-control"], [data-slot="textarea"] { line-height: 1.25rem; }
  }
`

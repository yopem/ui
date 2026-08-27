import * as stylex from "@stylexjs/stylex"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Slider } from "@/components/ui/stylex/slider"

export default function Particle() {
  return (
    <>
      <style>{demoCss}</style>
      <Field {...stylex.props(demoStyles.demo1)}>
        <FieldLabel>Country</FieldLabel>
        <Slider defaultValue={50} />
        <FieldDescription>This is an optional field</FieldDescription>
      </Field>
    </>
  )
}

const demoStyles = stylex.create({
  demo1: {
    alignItems: "stretch !important",
    gap: "calc(0.25rem * 3) !important",
  },
})

const demoCss = `
  [data-slot="slider-indicator"] { margin-inline-start: 0.125rem; }
  [data-slot="slider-thumb"]::before {
    border-radius: 9999px;
    box-shadow: 0 1px rgb(0 0 0 / 4%);
    content: "";
    inset: 0;
    position: absolute;
  }
`

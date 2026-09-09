import * as stylex from "@stylexjs/stylex"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Slider } from "@/components/ui/stylex/slider"

export default function Particle() {
  return (
    <Field {...stylex.props(demoStyles.demo1)}>
      <FieldLabel>Country</FieldLabel>
      <Slider defaultValue={50} />
      <FieldDescription>This is an optional field</FieldDescription>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    alignItems: "stretch !important",
    gap: "calc(0.25rem * 3) !important",
  },
})

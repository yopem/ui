import * as stylex from "@stylexjs/stylex"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Slider } from "@/components/ui/stylex/slider"

export default function Example() {
  return (
    <Field {...stylex.props(exampleStyles.example1)}>
      <FieldLabel>Country</FieldLabel>
      <Slider defaultValue={50} />
      <FieldDescription>This is an optional field</FieldDescription>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    alignItems: "stretch !important",
    gap: "calc(0.25rem * 3) !important",
  },
})

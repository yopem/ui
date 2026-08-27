import * as stylex from "@stylexjs/stylex"

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"

export default function Particle() {
  return (
    <NumberField defaultValue={0}>
      <NumberFieldGroup {...stylex.props(demoStyles.report1Manual)}>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

const demoStyles = stylex.create({
  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999px",
    borderRadius: "9999px",
  },
})

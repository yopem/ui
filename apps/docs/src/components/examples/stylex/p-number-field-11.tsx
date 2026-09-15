import * as stylex from "@stylexjs/stylex"

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"

export default function Example() {
  return (
    <NumberField defaultValue={0}>
      <NumberFieldGroup {...stylex.props(exampleStyles.report1Manual)}>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Quantity" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

const exampleStyles = stylex.create({
  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999px",
    borderRadius: "9999px",
  },
})

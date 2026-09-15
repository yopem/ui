import * as stylex from "@stylexjs/stylex"

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/ui/stylex/number-field"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <NumberField defaultValue={0} step={10}>
        <NumberFieldScrubArea label="Step 10" />
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      <NumberField defaultValue={0} step={0.1}>
        <NumberFieldScrubArea label="Step 0.1" />
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
    </div>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 6)",
  },
})

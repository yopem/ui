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
    <div {...stylex.props(demoStyles.demo1)}>
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

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 6)",
  },
})

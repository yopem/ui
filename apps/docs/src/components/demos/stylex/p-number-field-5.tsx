import * as stylex from "@stylexjs/stylex"
import { useId } from "react"

import { Label } from "@/components/ui/stylex/label"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"

export default function Particle() {
  const id = useId()
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Label htmlFor={id}>Quantity</Label>
      <NumberField defaultValue={0} id={id}>
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
    alignItems: "flex-start",
    gap: "calc(0.25rem * 2)",
  },
})

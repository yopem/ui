import { Field, FieldDescription } from "@/components/ui/stylex/field"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/ui/stylex/number-field"

function QuantityControls() {
  return (
    <NumberFieldGroup>
      <NumberFieldDecrement />
      <NumberFieldInput />
      <NumberFieldIncrement />
    </NumberFieldGroup>
  )
}

export default function Example() {
  return (
    <Field>
      <NumberField defaultValue={1} max={100} min={1}>
        <NumberFieldScrubArea label="Quantity" />
        <QuantityControls />
      </NumberField>
      <FieldDescription>Choose a value between 1 and 100.</FieldDescription>
    </Field>
  )
}

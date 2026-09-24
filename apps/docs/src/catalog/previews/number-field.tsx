import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field"

export function Preview() {
  return (
    <NumberField defaultValue={0}>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Quantity" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

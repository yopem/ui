import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field"

export default function Example() {
  return (
    <NumberField defaultValue={42} disabled>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Value" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

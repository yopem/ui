import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"

export default function Example() {
  return (
    <NumberField defaultValue={0} size="lg">
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Value" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

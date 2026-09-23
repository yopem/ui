import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field"

export default function Example() {
  return (
    <NumberField defaultValue={0} size="sm">
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Value" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

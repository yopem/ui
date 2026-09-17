import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"

export default function Example() {
  return (
    <NumberField defaultValue={5} max={10} min={0}>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput aria-label="Value between 0 and 10" />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  )
}

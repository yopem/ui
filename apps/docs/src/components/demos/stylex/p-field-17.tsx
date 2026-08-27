import { Field, FieldDescription } from "@/components/ui/stylex/field"
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
    <>
      <style>{demoCss}</style>
      <Field>
        <NumberField defaultValue={1} max={100} min={1}>
          <NumberFieldScrubArea label="Quantity" />
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
        <FieldDescription>Choose a value between 1 and 100.</FieldDescription>
      </Field>
    </>
  )
}

const demoCss = `
  [data-slot="number-field-group"]::before {
    border-radius: calc(var(--radius-lg) - 1px);
    box-shadow: 0 1px rgb(0 0 0 / 4%);
    content: "";
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  [data-theme="dark"] [data-slot="number-field-group"]::before {
    box-shadow: 0 -1px rgb(255 255 255 / 6%);
  }
  @media (min-width: 640px) {
    [data-slot="number-field-group"] { line-height: 1.25rem; }
  }
`

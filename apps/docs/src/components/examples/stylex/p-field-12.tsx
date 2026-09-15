import { Checkbox } from "@/components/ui/stylex/checkbox"
import { Field, FieldLabel } from "@/components/ui/stylex/field"

export default function Example() {
  return (
    <Field>
      <FieldLabel>
        <Checkbox />
        Accept terms and conditions
      </FieldLabel>
    </Field>
  )
}

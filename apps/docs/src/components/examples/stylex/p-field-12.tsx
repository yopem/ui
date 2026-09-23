import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"

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

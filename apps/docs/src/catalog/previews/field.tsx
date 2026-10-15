import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"

export function Preview() {
  return (
    <Field>
      <FieldLabel>Name</FieldLabel>
      <Input placeholder="Nora Ellis" type="text" />
      <FieldDescription>
        Use the name on your equipment reservation.
      </FieldDescription>
    </Field>
  )
}

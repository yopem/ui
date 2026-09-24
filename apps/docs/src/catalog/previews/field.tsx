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
      <Input placeholder="Enter your name" type="text" />
      <FieldDescription>Visible on your profile</FieldDescription>
    </Field>
  )
}

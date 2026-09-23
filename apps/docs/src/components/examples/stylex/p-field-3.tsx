import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function Example() {
  return (
    <Field disabled>
      <FieldLabel>Email</FieldLabel>
      <Input disabled placeholder="Enter your email" type="email" />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  )
}

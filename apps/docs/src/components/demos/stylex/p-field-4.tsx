import { Field, FieldError, FieldLabel } from "@/components/ui/stylex/field"
import { Input } from "@/components/ui/stylex/input"

export default function FieldWithErrorDemo() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="Enter your email" type="email" />
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  )
}

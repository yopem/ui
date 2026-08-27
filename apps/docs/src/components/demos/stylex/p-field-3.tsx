import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <Field disabled>
      <FieldLabel>Email</FieldLabel>
      <Input disabled placeholder="Enter your email" type="email" />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  )
}

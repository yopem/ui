import { Field, FieldError, FieldLabel } from "@/components/ui/tailwind/field"
import { Input } from "@/components/ui/tailwind/input"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        Password <span className="text-destructive-foreground">*</span>
      </FieldLabel>
      <Input placeholder="Enter password" required type="password" />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}

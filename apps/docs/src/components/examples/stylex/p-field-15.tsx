import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Switch } from "@/components/ui/stylex/switch"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        <Switch />
        Email notifications
      </FieldLabel>
    </Field>
  )
}

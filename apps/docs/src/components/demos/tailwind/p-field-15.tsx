import { Field, FieldLabel } from "@/components/ui/tailwind/field"
import { Switch } from "@/components/ui/tailwind/switch"

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

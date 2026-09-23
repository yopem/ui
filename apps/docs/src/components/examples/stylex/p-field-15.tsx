import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export default function Example() {
  return (
    <Field>
      <FieldLabel>
        <Switch />
        Email notifications
      </FieldLabel>
    </Field>
  )
}

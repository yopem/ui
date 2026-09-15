import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Switch } from "@/components/ui/stylex/switch"

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

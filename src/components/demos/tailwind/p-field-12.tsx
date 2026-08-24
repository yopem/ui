import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { Field, FieldLabel } from "@/components/ui/tailwind/field"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        <Checkbox />
        Accept terms and conditions
      </FieldLabel>
    </Field>
  )
}

import { Field, FieldLabel } from "@/components/ui/stylex/field"
import { Switch } from "@/components/ui/stylex/switch"

export default function Particle() {
  return (
    <>
      <style>{demoCss}</style>
      <Field>
        <FieldLabel>
          <Switch />
          Email notifications
        </FieldLabel>
      </Field>
    </>
  )
}

const demoCss = `
  [data-slot="switch"] { inline-size: 2.375rem; }
  [data-slot="switch-thumb"] {
    box-shadow: 0 1px 3px rgb(0 0 0 / 5%), 0 1px 2px -1px rgb(0 0 0 / 5%);
  }
  @media (min-width: 640px) {
    [data-slot="switch"] { inline-size: 1.875rem; }
  }
`

import { Checkbox } from "@/components/ui/stylex/checkbox"
import { Field, FieldLabel } from "@/components/ui/stylex/field"

export default function Particle() {
  return (
    <>
      <style>{demoCss}</style>
      <Field>
        <FieldLabel>
          <Checkbox />
          Accept terms and conditions
        </FieldLabel>
      </Field>
    </>
  )
}

const demoCss = `
  [data-slot="checkbox"] { background-clip: padding-box; }
  [data-slot="checkbox"]::before {
    border-radius: 3px;
    box-shadow: 0 1px rgb(0 0 0 / 4%);
    content: "";
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  [data-slot="checkbox"][data-checked] { box-shadow: none; }
  [data-slot="checkbox"][data-checked]::before { box-shadow: none; }
  [data-theme="dark"] [data-slot="checkbox"] { background-clip: border-box; }
  [data-theme="dark"] [data-slot="checkbox"]::before {
    box-shadow: 0 -1px rgb(255 255 255 / 6%);
  }
  [data-slot="checkbox"][data-checked]::before { box-shadow: none; }
`

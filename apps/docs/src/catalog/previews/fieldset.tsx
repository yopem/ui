import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@registry/components/ui/field"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { Input } from "@registry/components/ui/input"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  fieldset: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 6)",
  },
})

export function Preview() {
  return (
    <Fieldset xstyle={styles.fieldset}>
      <FieldsetLegend>Billing Details</FieldsetLegend>
      <Field>
        <FieldLabel>Company</FieldLabel>
        <Input placeholder="Enter company name" type="text" />
        <FieldDescription>
          The name that will appear on invoices.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Tax ID</FieldLabel>
        <Input placeholder="Enter tax identification number" type="text" />
        <FieldDescription>
          Your business tax identification number.
        </FieldDescription>
      </Field>
    </Fieldset>
  )
}

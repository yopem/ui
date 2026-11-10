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
    <>
      <Fieldset xstyle={styles.fieldset}>
        <FieldsetLegend>Station membership</FieldsetLegend>
        <Field>
          <FieldLabel>Group</FieldLabel>
          <Input placeholder="Willow Creek volunteers" type="text" />
          <FieldDescription>
            The group that will use the equipment.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Member ID</FieldLabel>
          <Input placeholder="WC-2048" type="text" />
          <FieldDescription>
            Find this code on your station membership card.
          </FieldDescription>
        </Field>
      </Fieldset>
      <Fieldset bordered disabled xstyle={styles.fieldset}>
        <FieldsetLegend>Archived membership</FieldsetLegend>
        <Field>
          <FieldLabel>Archived group</FieldLabel>
          <Input type="text" />
        </Field>
      </Fieldset>
    </>
  )
}

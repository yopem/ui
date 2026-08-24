"use client"

import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { CheckboxGroup } from "@/components/ui/tailwind/checkbox-group"
import { Field, FieldItem, FieldLabel } from "@/components/ui/tailwind/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/tailwind/fieldset"

export default function Particle() {
  return (
    <Field
      className="gap-2"
      name="frameworks"
      render={(props) => <Fieldset {...props} />}
    >
      <FieldsetLegend className="text-sm font-medium">
        Frameworks
      </FieldsetLegend>
      <CheckboxGroup defaultValue={["react"]}>
        <FieldItem>
          <FieldLabel>
            <Checkbox value="react" /> React
          </FieldLabel>
        </FieldItem>
        <FieldItem>
          <FieldLabel>
            <Checkbox value="vue" /> Vue
          </FieldLabel>
        </FieldItem>
        <FieldItem>
          <FieldLabel>
            <Checkbox value="svelte" /> Svelte
          </FieldLabel>
        </FieldItem>
      </CheckboxGroup>
    </Field>
  )
}

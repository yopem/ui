"use client"

import * as stylex from "@stylexjs/stylex"

import { Checkbox } from "@/components/ui/stylex/checkbox"
import { CheckboxGroup } from "@/components/ui/stylex/checkbox-group"
import { Field, FieldItem, FieldLabel } from "@/components/ui/stylex/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/stylex/fieldset"

export default function Particle() {
  return (
    <Field
      {...stylex.props(demoStyles.demo1)}
      name="frameworks"
      render={(props) => <Fieldset {...props} />}
    >
      <FieldsetLegend {...stylex.props(demoStyles.demo2)}>
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

const demoStyles = stylex.create({
  demo1: {
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    fontSize: "0.875rem !important",
    lineHeight: "1.25rem !important",
    fontWeight: "500 !important",
  },
})

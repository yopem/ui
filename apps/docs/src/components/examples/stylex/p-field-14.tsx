"use client"

import * as stylex from "@stylexjs/stylex"

import {
  Field,
  FieldDescription,
  FieldItem,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/stylex/fieldset"
import { Radio, RadioGroup } from "@/components/ui/stylex/radio-group"

export default function Example() {
  return (
    <Field
      {...stylex.props(exampleStyles.example1)}
      name="plan"
      render={(props) => <Fieldset {...props} />}
    >
      <FieldsetLegend {...stylex.props(exampleStyles.example2)}>
        Choose Plan
      </FieldsetLegend>
      <RadioGroup defaultValue="free">
        <FieldItem>
          <FieldLabel>
            <Radio value="free" /> Free
          </FieldLabel>
        </FieldItem>
        <FieldItem>
          <FieldLabel>
            <Radio value="pro" /> Pro
          </FieldLabel>
        </FieldItem>
        <FieldItem>
          <FieldLabel>
            <Radio value="enterprise" /> Enterprise
          </FieldLabel>
        </FieldItem>
      </RadioGroup>
      <FieldDescription>Select the plan that fits your needs.</FieldDescription>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    fontSize: "0.875rem !important",
    lineHeight: "1.25rem !important",
    fontWeight: "500 !important",
  },
})

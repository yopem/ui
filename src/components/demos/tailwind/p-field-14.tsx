"use client";

import {
  Field,
  FieldDescription,
  FieldItem,
  FieldLabel,
} from "@/components/ui/tailwind/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/tailwind/fieldset";
import { Radio, RadioGroup } from "@/components/ui/tailwind/radio-group";

export default function Particle() {
  return (
    <Field
      className="gap-2"
      name="plan"
      render={(props) => <Fieldset {...props} />}
    >
      <FieldsetLegend className="font-medium text-sm">
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
  );
}

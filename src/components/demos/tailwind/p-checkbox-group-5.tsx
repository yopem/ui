"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/tailwind/button";
import { Checkbox } from "@/components/ui/tailwind/checkbox";
import { CheckboxGroup } from "@/components/ui/tailwind/checkbox-group";
import { Field, FieldItem, FieldLabel } from "@/components/ui/tailwind/field";
import { Fieldset, FieldsetLegend } from "@/components/ui/tailwind/fieldset";
import { Form } from "@/components/ui/tailwind/form";

export default function Particle() {
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    const frameworks = formData.getAll("frameworks") as string[];
    alert(`Selected: ${frameworks.join(", ") || "none"}`);
  };

  return (
    <Form
      className="flex w-full max-w-[160px] flex-col gap-4"
      onSubmit={onSubmit}
    >
      <Field name="frameworks" render={(props) => <Fieldset {...props} />}>
        <FieldsetLegend className="font-medium text-sm">
          Frameworks
        </FieldsetLegend>
        <CheckboxGroup defaultValue={["next"]}>
          <FieldItem>
            <FieldLabel>
              <Checkbox value="next" />
              Next.js
            </FieldLabel>
          </FieldItem>
          <FieldItem>
            <FieldLabel>
              <Checkbox value="vite" />
              Vite
            </FieldLabel>
          </FieldItem>
          <FieldItem>
            <FieldLabel>
              <Checkbox value="astro" />
              Astro
            </FieldLabel>
          </FieldItem>
        </CheckboxGroup>
      </Field>
      <Button loading={loading} type="submit">
        Submit
      </Button>
    </Form>
  );
}

"use client"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export default function Example() {
  return (
    <Field>
      <FieldLabel>Bio</FieldLabel>
      <Textarea placeholder="Tell us about yourself…" />
      <FieldDescription>
        Write a short bio. Maximum 500 characters.
      </FieldDescription>
    </Field>
  )
}

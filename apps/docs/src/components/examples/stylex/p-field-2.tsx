import * as stylex from "@stylexjs/stylex"

import { Field, FieldError, FieldLabel } from "@/components/ui/stylex/field"
import { Input } from "@/components/ui/stylex/input"

export default function Example() {
  return (
    <Field>
      <FieldLabel>
        Password <span {...stylex.props(exampleStyles.example1)}>*</span>
      </FieldLabel>
      <Input placeholder="Enter password" required type="password" />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    color: "var(--destructive-foreground)",
  },
})

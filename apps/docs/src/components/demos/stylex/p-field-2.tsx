import * as stylex from "@stylexjs/stylex"

import { Field, FieldError, FieldLabel } from "@/components/ui/stylex/field"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        Password <span {...stylex.props(demoStyles.demo1)}>*</span>
      </FieldLabel>
      <Input placeholder="Enter password" required type="password" />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    color: "var(--destructive-foreground)",
  },
})

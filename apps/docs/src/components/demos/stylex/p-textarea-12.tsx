import * as stylex from "@stylexjs/stylex"

import { Field, FieldError, FieldLabel } from "@/components/ui/stylex/field"
import { Textarea } from "@/components/ui/stylex/textarea"

export default function Particle() {
  return (
    <Field>
      <FieldLabel>
        Message <span {...stylex.props(demoStyles.demo1)}>*</span>
      </FieldLabel>
      <Textarea placeholder="Type your message here" required />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    color: "var(--destructive-foreground)",
  },
})

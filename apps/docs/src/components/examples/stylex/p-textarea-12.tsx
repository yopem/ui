import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
export default function Example() {
  return (
    <Field>
      <FieldLabel>
        Message{" "}
        <Box as="span" {...stylex.props(exampleStyles.example1)}>
          *
        </Box>
      </FieldLabel>
      <Textarea placeholder="Type your message here" required />
      <FieldError>Please fill out this field.</FieldError>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    color: "var(--destructive-foreground)",
  },
})

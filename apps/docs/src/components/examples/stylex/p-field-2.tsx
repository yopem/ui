import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
import { Field, FieldError, FieldLabel } from "@/components/ui/stylex/field"
import { Input } from "@/components/ui/stylex/input"
export default function Example() {
  return (
    <Field>
      <FieldLabel>
        Password{" "}
        <Box as="span" {...stylex.props(exampleStyles.example1)}>
          *
        </Box>
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

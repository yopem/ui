import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field"
const OTP_LENGTH = 6

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export default function Example() {
  return (
    <Field {...stylex.props(exampleStyles.example1)}>
      <FieldLabel>Recovery code</FieldLabel>
      <OTPField length={OTP_LENGTH} validationType="alphanumeric">
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField>
      <FieldDescription>
        Accept letters and numbers for backup codes such as{" "}
        <Box as="code" {...stylex.props(exampleStyles.example2)}>
          A7C9XZ
        </Box>
        .
      </FieldDescription>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    alignItems: "center !important",
  },
  example2: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    color: "var(--foreground)",
  },
})

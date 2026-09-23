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
      <FieldLabel>Access code</FieldLabel>
      <OTPField length={OTP_LENGTH} mask>
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField>
      <FieldDescription>
        Use{" "}
        <Box as="code" {...stylex.props(exampleStyles.example2)}>
          mask
        </Box>{" "}
        to obscure the code on shared screens.
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

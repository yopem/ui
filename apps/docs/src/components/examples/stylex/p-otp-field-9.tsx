import * as stylex from "@stylexjs/stylex"

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
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={OTP_LENGTH}>
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
            {...stylex.props(exampleStyles.slot)}
            placeholder="•"
          />
        ))}
      </OTPField>
      <FieldDescription>
        Placeholder hints stay visible until the focused slot is active.
      </FieldDescription>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    alignItems: "center !important",
  },
  slot: {
    "::placeholder": {
      color: "var(--muted-foreground)",
    },
    ":focus-visible::placeholder": {
      color: "transparent",
    },
  },
})

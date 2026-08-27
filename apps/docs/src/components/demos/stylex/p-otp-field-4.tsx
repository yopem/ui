import * as stylex from "@stylexjs/stylex"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { OTPField, OTPFieldInput } from "@/components/ui/stylex/otp-field"

const OTP_LENGTH = 4

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export default function Particle() {
  return (
    <Field {...stylex.props(demoStyles.demo1)}>
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={OTP_LENGTH}>
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField>
      <FieldDescription>
        Enter the {OTP_LENGTH}-digit code sent to your email.
      </FieldDescription>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    alignItems: "center !important",
  },
})

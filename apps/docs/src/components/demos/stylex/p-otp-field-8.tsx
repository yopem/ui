import * as stylex from "@stylexjs/stylex"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/stylex/field"
import { OTPField, OTPFieldInput } from "@/components/ui/stylex/otp-field"

const OTP_LENGTH = 6

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export default function Particle() {
  return (
    <Field {...stylex.props(demoStyles.demo1)}>
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
        <code {...stylex.props(demoStyles.demo2)}>A7C9XZ</code>.
      </FieldDescription>
    </Field>
  )
}

const demoStyles = stylex.create({
  demo1: {
    alignItems: "center !important",
  },
  demo2: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    color: "var(--foreground)",
  },
})

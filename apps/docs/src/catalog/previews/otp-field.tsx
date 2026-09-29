import { Box } from "@registry/components/ui/box"
import { OTPField, OTPFieldInput } from "@registry/components/ui/otp-field"

const OTP_LENGTH = 6

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export function Preview() {
  return (
    <Box as="label" aria-label="One-time password">
      <OTPField length={OTP_LENGTH}>
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField>
    </Box>
  )
}

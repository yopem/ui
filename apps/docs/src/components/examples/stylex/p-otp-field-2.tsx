import { Label } from "@/components/ui/label"
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field"

const OTP_LENGTH = 4

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export default function Example() {
  return (
    <>
      <Label htmlFor="one-time-password">One-time password</Label>
      <OTPField id="one-time-password" length={OTP_LENGTH} size="lg">
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={
              index === 0
                ? undefined
                : `Character ${index + 1} of ${OTP_LENGTH}`
            }
          />
        ))}
      </OTPField>
    </>
  )
}

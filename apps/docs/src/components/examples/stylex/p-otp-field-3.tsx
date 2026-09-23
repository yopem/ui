import { Label } from "@/components/ui/label"
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/components/ui/otp-field"

const OTP_LENGTH = 6
const GROUP_LENGTH = 3

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export default function Example() {
  return (
    <>
      <Label htmlFor="verification-code">Verification code</Label>
      <OTPField id="verification-code" length={OTP_LENGTH}>
        {OTP_SLOT_KEYS.slice(0, GROUP_LENGTH).map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={
              index === 0
                ? undefined
                : `Character ${index + 1} of ${OTP_LENGTH}`
            }
          />
        ))}
        <OTPFieldSeparator />
        {OTP_SLOT_KEYS.slice(GROUP_LENGTH).map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + GROUP_LENGTH + 1} of ${OTP_LENGTH}`}
          />
        ))}
      </OTPField>
    </>
  )
}

import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/components/ui/stylex/otp-field"

const OTP_LENGTH = 6
const GROUP_LENGTH = 3

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export default function Example() {
  return (
    <label aria-label="Verification code">
      <OTPField length={OTP_LENGTH}>
        {OTP_SLOT_KEYS.slice(0, GROUP_LENGTH).map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
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
    </label>
  )
}

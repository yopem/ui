import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/tailwind/field"
import { OTPField, OTPFieldInput } from "@/components/ui/tailwind/otp-field"
import { cn } from "@/lib/utils"

const OTP_LENGTH = 6

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

export default function Particle() {
  return (
    <Field className="items-center">
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={OTP_LENGTH}>
        {OTP_SLOT_KEYS.map((slotKey, index) => (
          <OTPFieldInput
            key={slotKey}
            aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
            className={cn(
              "placeholder:text-muted-foreground focus-visible:placeholder:text-transparent",
            )}
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

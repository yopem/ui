"use client"

import * as stylex from "@stylexjs/stylex"
import { useEffect, useRef, useState } from "react"

import { Box } from "@/components/ui/box"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { OTPField, OTPFieldInput } from "@/components/ui/otp-field"
const OTP_LENGTH = 6

const OTP_SLOT_KEYS = Array.from(
  { length: OTP_LENGTH },
  (_, i) => `otp-slot-${i}`,
)

function normalizeTierCode(value: string) {
  return value.replace(/[^0-3]/g, "")
}

export default function Example() {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [invalidPulse, setInvalidPulse] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const invalidTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipClearOnNextValueChangeRef = useRef(false)

  useEffect(() => {
    return () => {
      if (invalidTimeoutRef.current != null) {
        clearTimeout(invalidTimeoutRef.current)
      }
    }
  }, [])

  function clearInvalidFeedback() {
    if (invalidTimeoutRef.current != null) {
      clearTimeout(invalidTimeoutRef.current)
      invalidTimeoutRef.current = null
    }
    setInvalidPulse(0)
    setStatusMessage("")
  }

  function handleValueChange() {
    if (skipClearOnNextValueChangeRef.current) {
      skipClearOnNextValueChangeRef.current = false
      return
    }
    clearInvalidFeedback()
  }

  function handleValueInvalid(value: string) {
    skipClearOnNextValueChangeRef.current = true
    setInvalidPulse((current) => current + 1)
    setStatusMessage(`Unsupported characters were ignored from ${value}.`)

    if (invalidTimeoutRef.current != null) {
      clearTimeout(invalidTimeoutRef.current)
    }
    invalidTimeoutRef.current = setTimeout(() => {
      invalidTimeoutRef.current = null
      setInvalidPulse(0)
    }, 400)
  }

  const activeInvalidIndex = invalidPulse > 0 ? focusedIndex : -1

  return (
    <Field {...stylex.props(exampleStyles.example1)}>
      <FieldLabel>Tier code</FieldLabel>
      <OTPField
        inputMode="numeric"
        length={OTP_LENGTH}
        normalizeValue={normalizeTierCode}
        validationType="none"
        onValueChange={handleValueChange}
        onValueInvalid={handleValueInvalid}
      >
        {OTP_SLOT_KEYS.map((slotKey, index) => {
          const showInvalid = activeInvalidIndex === index && invalidPulse > 0

          return (
            <OTPFieldInput
              key={slotKey}
              aria-invalid={showInvalid || undefined}
              aria-label={`Character ${index + 1} of ${OTP_LENGTH}`}
              onFocus={() => {
                setFocusedIndex(index)
              }}
            />
          )
        })}
      </OTPField>
      <FieldDescription>Digits 0-3 only.</FieldDescription>
      <Box
        as="span"
        aria-live="polite"
        {...stylex.props(exampleStyles.example2)}
      >
        {statusMessage}
      </Box>
    </Field>
  )
}

const exampleStyles = stylex.create({
  example1: {
    alignItems: "center !important",
  },
  example2: {
    position: "absolute",
    inlineSize: "1px",
    blockSize: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
})

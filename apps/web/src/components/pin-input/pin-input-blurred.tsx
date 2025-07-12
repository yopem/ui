"use client"

import {
  PinInput,
  PinInputControl,
  PinInputGroup,
  PinInputHiddenInput,
  PinInputInput,
  PinInputLabel,
} from "@yopem-ui/react"

export const PinInputBlurred = () => (
  <PinInput blurOnComplete>
    <PinInputGroup>
      <PinInputLabel>Blurred</PinInputLabel>
      <PinInputControl>
        {[0, 1, 2].map((id, index) => (
          <PinInputInput key={id} index={index} />
        ))}
      </PinInputControl>
      <PinInputHiddenInput />
    </PinInputGroup>
  </PinInput>
)

"use client"

import {
  PinInput,
  PinInputControl,
  PinInputGroup,
  PinInputHiddenInput,
  PinInputInput,
  PinInputLabel,
} from "@yopem-ui/react"

export const PinInputBasic = () => (
  <PinInput onValueComplete={(e) => alert(e.valueAsString)}>
    <PinInputGroup>
      <PinInputLabel>Basic</PinInputLabel>
      <PinInputControl>
        {[0, 1, 2].map((id, index) => (
          <PinInputInput key={id} index={index} />
        ))}
      </PinInputControl>
      <PinInputHiddenInput />
    </PinInputGroup>
  </PinInput>
)

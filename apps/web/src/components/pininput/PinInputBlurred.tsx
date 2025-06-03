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
  <PinInput
    blurOnComplete
    onValueComplete={(value) => {
      console.log("Completed:", value)
    }}
  >
    <PinInputGroup>
      <PinInputLabel>Blurred</PinInputLabel>
      <PinInputControl>
        {[0, 1, 2].map((id, index) => (
          <PinInputInput
            onBlur={() => console.log("Blurred")}
            key={id}
            index={index}
          />
        ))}
      </PinInputControl>
      <PinInputHiddenInput />
    </PinInputGroup>
  </PinInput>
)

import {
  PinInput,
  PinInputControl,
  PinInputHiddenInput,
  PinInputInput,
  PinInputLabel,
} from "@yopem-ui/react"

const pinInputComponent = {
  name: "PinInput",
  description:
    "A component for entering PIN codes with individual input fields.",
  code: `
    <div>
      <PinInput defaultValue={["1", "2", "3"]}>
        <PinInputLabel>Label</PinInputLabel>
        <PinInputControl>
          {[0, 1, 2].map((id, index) => (
            <PinInputInput key={id} index={index} />
          ))}
        </PinInputControl>
        <PinInputHiddenInput />
      </PinInput>
    </div>
  `,
  preview: (
    <div>
      <PinInput defaultValue={["1", "2", "3"]}>
        <PinInputLabel>Label</PinInputLabel>
        <PinInputControl>
          {[0, 1, 2].map((id, index) => (
            <PinInputInput key={id} index={index} />
          ))}
        </PinInputControl>
        <PinInputHiddenInput />
      </PinInput>
    </div>
  ),
}

export default pinInputComponent

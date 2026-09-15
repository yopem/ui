import * as stylex from "@stylexjs/stylex"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/stylex/input-group"
import {
  NumberField,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"

export default function Example() {
  return (
    <InputGroup>
      <NumberField aria-label="Enter the amount" defaultValue={10}>
        <NumberFieldInput {...stylex.props(exampleStyles.example1)} />
      </NumberField>
      <InputGroupAddon>
        <InputGroupText>€</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupText>EUR</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  example1: {
    textAlign: "left",
  },
})

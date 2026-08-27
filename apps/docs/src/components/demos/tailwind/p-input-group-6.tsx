import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/tailwind/input-group"
import {
  NumberField,
  NumberFieldInput,
} from "@/components/ui/tailwind/number-field"

export default function Particle() {
  return (
    <InputGroup>
      <NumberField aria-label="Enter the amount" defaultValue={10}>
        <NumberFieldInput className="text-left" />
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

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Choose a username"
        placeholder="Choose a username"
        type="text"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>@coss.com</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}

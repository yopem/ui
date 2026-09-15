import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import { Kbd } from "@/components/ui/stylex/kbd"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupInput placeholder="Search…" type="search" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}

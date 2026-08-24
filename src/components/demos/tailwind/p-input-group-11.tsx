import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"
import { Kbd } from "@/components/ui/tailwind/kbd"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput placeholder="Search…" type="search" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}

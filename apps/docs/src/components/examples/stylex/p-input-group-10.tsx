import { Badge } from "@/components/ui/stylex/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupInput placeholder="Type to search…" type="search" />
      <InputGroupAddon align="inline-end">
        <Badge variant="info">Badge</Badge>
      </InputGroupAddon>
    </InputGroup>
  )
}

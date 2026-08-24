import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput
        aria-label="Subscribe to our newsletter"
        disabled
        placeholder="Your best email"
        type="email"
      />
      <InputGroupAddon align="inline-end">
        <Button aria-label="Subscribe" disabled size="icon-xs" variant="ghost">
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"

export default function Particle() {
  return (
    <Button>
      Get Started
      <ArrowRightIcon
        aria-hidden="true"
        className="transition-transform in-[[data-slot=button]:hover]:translate-x-0.5"
      />
    </Button>
  )
}

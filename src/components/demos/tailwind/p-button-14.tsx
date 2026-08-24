import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"

export default function Particle() {
  return (
    <Button aria-label="Add" size="icon-sm">
      <PlusIcon aria-hidden="true" />
    </Button>
  )
}

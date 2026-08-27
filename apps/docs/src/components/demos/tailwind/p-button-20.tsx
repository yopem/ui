import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"

export default function Particle() {
  return (
    <Button variant="link">
      <ChevronLeftIcon aria-hidden="true" />
      Go back
    </Button>
  )
}

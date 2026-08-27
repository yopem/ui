import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button variant="link">
      <ChevronLeftIcon aria-hidden="true" />
      Go back
    </Button>
  )
}

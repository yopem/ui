import { Badge } from "@/components/ui/tailwind/badge"
import { Button } from "@/components/ui/tailwind/button"

export default function Particle() {
  return (
    <Button variant="outline">
      Messages
      <Badge className="-me-1" variant="outline">
        18
      </Badge>
    </Button>
  )
}

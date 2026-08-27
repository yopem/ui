import { CheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/stylex/badge"

export default function Particle() {
  return (
    <Badge variant="outline">
      <CheckIcon aria-hidden="true" />
      Verified
    </Badge>
  )
}

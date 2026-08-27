import { Badge } from "@/components/ui/tailwind/badge"

export default function Particle() {
  return (
    <Badge variant="outline">
      Notifications
      <span className="text-primary ms-1 font-semibold">5</span>
    </Badge>
  )
}

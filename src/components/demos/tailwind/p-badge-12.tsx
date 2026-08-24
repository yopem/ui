// next/link replaced -> anchor
import { Badge } from "@/components/ui/tailwind/badge"

export default function Particle() {
  return <Badge render={<a aria-label="Home" href="/" />}>Badge</Badge>
}

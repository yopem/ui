// next/link replaced -> anchor
import { Badge } from "@/components/ui/badge"
import { Link } from "@/components/ui/link"
export default function Example() {
  return <Badge render={<Link aria-label="Home" href="/" />}>Badge</Badge>
}

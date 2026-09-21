// next/link replaced -> anchor
import { Badge } from "@/components/ui/stylex/badge"
import { Link } from "@/components/ui/stylex/link"
export default function Example() {
  return <Badge render={<Link aria-label="Home" href="/" />}>Badge</Badge>
}

// next/link replaced -> anchor
import { Badge } from "@/components/ui/stylex/badge"

export default function Example() {
  return <Badge render={<a aria-label="Home" href="/" />}>Badge</Badge>
}

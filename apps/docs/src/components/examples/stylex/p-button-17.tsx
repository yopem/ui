// next/link replaced -> anchor
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
export default function Example() {
  return <Button render={<Link aria-label="Home" href="/" />}>Link</Button>
}

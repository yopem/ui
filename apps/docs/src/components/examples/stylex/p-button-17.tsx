// next/link replaced -> anchor
import { Button } from "@/components/ui/stylex/button"
import { Link } from "@/components/ui/stylex/link"
export default function Example() {
  return <Button render={<Link aria-label="Home" href="/" />}>Link</Button>
}

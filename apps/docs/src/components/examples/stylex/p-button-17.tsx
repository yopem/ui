// next/link replaced -> anchor
import { Button } from "@/components/ui/stylex/button"

export default function Example() {
  return <Button render={<a aria-label="Home" href="/" />}>Link</Button>
}

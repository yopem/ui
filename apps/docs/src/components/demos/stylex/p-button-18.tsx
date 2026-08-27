import { Button } from "@/components/ui/stylex/button"
import { Spinner } from "@/components/ui/stylex/spinner"

export default function Particle() {
  return (
    <Button disabled>
      <Spinner />
      Loading...
    </Button>
  )
}

import { Button } from "@/components/ui/tailwind/button"
import { Spinner } from "@/components/ui/tailwind/spinner"

export default function Particle() {
  return (
    <Button disabled>
      <Spinner />
      Loading...
    </Button>
  )
}

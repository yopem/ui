import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { Label } from "@/components/ui/tailwind/label"

export default function Particle() {
  return (
    <Label>
      <Checkbox aria-label="Accept terms and conditions" />
      Accept terms and conditions
    </Label>
  )
}

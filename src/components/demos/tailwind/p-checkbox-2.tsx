import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { Label } from "@/components/ui/tailwind/label"

export default function Particle() {
  return (
    <Label>
      <Checkbox defaultChecked disabled />
      Accept terms and conditions
    </Label>
  )
}

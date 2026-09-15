import { Checkbox } from "@/components/ui/stylex/checkbox"
import { Label } from "@/components/ui/stylex/label"

export default function Particle() {
  return (
    <Label>
      <Checkbox defaultChecked disabled />
      Accept terms and conditions
    </Label>
  )
}

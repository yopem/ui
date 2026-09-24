import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function Preview() {
  return (
    <Label>
      <Checkbox aria-label="Accept terms and conditions" />
      Accept terms and conditions
    </Label>
  )
}

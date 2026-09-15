import { Checkbox } from "@/components/ui/stylex/checkbox"
import { Label } from "@/components/ui/stylex/label"

export default function Example() {
  return (
    <Label>
      <Checkbox aria-label="Accept terms and conditions" />
      Accept terms and conditions
    </Label>
  )
}

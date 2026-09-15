import { Checkbox } from "@/components/ui/stylex/checkbox"
import { Label } from "@/components/ui/stylex/label"

export default function Example() {
  return (
    <Label>
      <Checkbox defaultChecked disabled />
      Accept terms and conditions
    </Label>
  )
}

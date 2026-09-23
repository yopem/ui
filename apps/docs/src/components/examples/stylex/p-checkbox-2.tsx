import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function Example() {
  return (
    <Label>
      <Checkbox defaultChecked disabled />
      Accept terms and conditions
    </Label>
  )
}

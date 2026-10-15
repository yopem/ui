import { Checkbox } from "@registry/components/ui/checkbox"
import { Label } from "@registry/components/ui/label"

export function Preview() {
  return (
    <Label>
      <Checkbox aria-label="Include a printed trail map" />
      Include a printed trail map
    </Label>
  )
}

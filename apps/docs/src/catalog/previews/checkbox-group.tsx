import { Checkbox } from "@registry/components/ui/checkbox"
import { CheckboxGroup } from "@registry/components/ui/checkbox-group"
import { Label } from "@registry/components/ui/label"

const previewDefaultValue = ["birdwatching"]

export function Preview() {
  return (
    <CheckboxGroup
      aria-label="Select equipment"
      defaultValue={previewDefaultValue}
    >
      <Label>
        <Checkbox value="birdwatching" />
        Birdwatching
      </Label>
      <Label>
        <Checkbox value="audio" />
        Audio recording
      </Label>
      <Label>
        <Checkbox value="mapping" />
        Trail mapping
      </Label>
    </CheckboxGroup>
  )
}

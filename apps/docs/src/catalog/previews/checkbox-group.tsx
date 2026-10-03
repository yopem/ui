import { Checkbox } from "@registry/components/ui/checkbox"
import { CheckboxGroup } from "@registry/components/ui/checkbox-group"
import { Label } from "@registry/components/ui/label"

const previewDefaultValue = ["next"]

export function Preview() {
  return (
    <CheckboxGroup
      aria-label="Select frameworks"
      defaultValue={previewDefaultValue}
    >
      <Label>
        <Checkbox value="next" />
        Next.js
      </Label>
      <Label>
        <Checkbox value="vite" />
        Vite
      </Label>
      <Label>
        <Checkbox value="astro" />
        Astro
      </Label>
    </CheckboxGroup>
  )
}

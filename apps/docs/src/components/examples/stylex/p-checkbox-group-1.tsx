import { Checkbox } from "@/components/ui/stylex/checkbox"
import { CheckboxGroup } from "@/components/ui/stylex/checkbox-group"
import { Label } from "@/components/ui/stylex/label"

export default function Example() {
  return (
    <CheckboxGroup aria-label="Select frameworks" defaultValue={["next"]}>
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

import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import { Label } from "@/components/ui/label"

export default function Example() {
  return (
    <CheckboxGroup aria-label="Select frameworks" defaultValue={["next"]}>
      <Label>
        <Checkbox value="next" />
        Next.js
      </Label>
      <Label>
        <Checkbox disabled value="vite" />
        Vite
      </Label>
      <Label>
        <Checkbox value="astro" />
        Astro
      </Label>
    </CheckboxGroup>
  )
}

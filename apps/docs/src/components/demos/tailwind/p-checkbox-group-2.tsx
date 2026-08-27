import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { CheckboxGroup } from "@/components/ui/tailwind/checkbox-group"
import { Label } from "@/components/ui/tailwind/label"

export default function Particle() {
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

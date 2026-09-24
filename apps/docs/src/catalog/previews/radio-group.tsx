import { Label } from "@registry/components/ui/label"
import { Radio, RadioGroup } from "@registry/components/ui/radio-group"

export function Preview() {
  return (
    <RadioGroup aria-label="Framework" defaultValue="next">
      <Label>
        <Radio aria-label="Next.js" value="next" /> Next.js
      </Label>
      <Label>
        <Radio aria-label="Vite" value="vite" /> Vite
      </Label>
      <Label>
        <Radio aria-label="Astro" value="astro" /> Astro
      </Label>
    </RadioGroup>
  )
}

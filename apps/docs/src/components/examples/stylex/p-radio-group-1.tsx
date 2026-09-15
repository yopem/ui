import { Label } from "@/components/ui/stylex/label"
import { Radio, RadioGroup } from "@/components/ui/stylex/radio-group"

export default function Example() {
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

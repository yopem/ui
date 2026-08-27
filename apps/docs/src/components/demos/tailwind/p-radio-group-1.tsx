import { Label } from "@/components/ui/tailwind/label"
import { Radio, RadioGroup } from "@/components/ui/tailwind/radio-group"

export default function Particle() {
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

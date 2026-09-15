import { Label } from "@/components/ui/stylex/label"
import { Radio, RadioGroup } from "@/components/ui/stylex/radio-group"

export default function Example() {
  return (
    <RadioGroup defaultValue="next">
      <Label>
        <Radio value="next" /> Next.js
      </Label>
      <Label>
        <Radio disabled value="vite" /> Vite (disabled)
      </Label>
      <Label>
        <Radio value="astro" /> Astro
      </Label>
    </RadioGroup>
  )
}

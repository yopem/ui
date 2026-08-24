import { Label } from "@/components/ui/tailwind/label";
import { Radio, RadioGroup } from "@/components/ui/tailwind/radio-group";

export default function Particle() {
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
  );
}

import { Label } from "@/components/ui/tailwind/label"
import { Radio, RadioGroup } from "@/components/ui/tailwind/radio-group"

export default function Particle() {
  return (
    <RadioGroup defaultValue="r-1">
      <div className="flex items-start gap-2">
        <Radio id="r-1" value="r-1" />
        <div className="flex flex-col gap-1">
          <Label htmlFor="r-1">Free</Label>
          <p className="text-muted-foreground text-xs">
            Basic features for personal use.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Radio id="r-2" value="r-2" />
        <div className="flex flex-col gap-1">
          <Label htmlFor="r-2">Pro</Label>
          <p className="text-muted-foreground text-xs">
            Advanced tools for professionals.
          </p>
        </div>
      </div>
    </RadioGroup>
  )
}

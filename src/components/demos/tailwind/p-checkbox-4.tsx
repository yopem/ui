import { Checkbox } from "@/components/ui/tailwind/checkbox"
import { Label } from "@/components/ui/tailwind/label"

export default function Particle() {
  return (
    <Label className="hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50 flex items-start gap-2 rounded-lg border p-3">
      <Checkbox defaultChecked />
      <div className="flex flex-col gap-1">
        <p>Enable notifications</p>
        <p className="text-muted-foreground text-xs">
          You can enable or disable notifications at any time.
        </p>
      </div>
    </Label>
  )
}

import { useId } from "react"

import { Label } from "@/components/ui/tailwind/label"
import { Switch } from "@/components/ui/tailwind/switch"

export default function Particle() {
  const id = useId()

  return (
    <Label
      className="hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50 flex items-center gap-6 rounded-lg border p-3"
      htmlFor={id}
    >
      <div className="flex flex-col gap-1">
        <p>Enable notifications</p>
        <p className="text-muted-foreground text-xs">
          You can enable or disable notifications at any time.
        </p>
      </div>
      <Switch
        className="[--thumb-size:--spacing(4)] sm:[--thumb-size:--spacing(3)]"
        defaultChecked
        id={id}
      />
    </Label>
  )
}

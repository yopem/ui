import { Label } from "@registry/components/ui/label"
import { Switch } from "@registry/components/ui/switch"

export function Preview() {
  return (
    <Label>
      <Switch aria-label="Marketing emails" />
      Marketing emails
    </Label>
  )
}

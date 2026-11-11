import { HStack } from "@registry/components/ui/hstack"
import { Label } from "@registry/components/ui/label"
import { Switch } from "@registry/components/ui/switch"
import { useId } from "react"

export function Preview() {
  const id = useId()

  const labelId = `${id}-label`
  const disabledId = `${id}-disabled`

  return (
    <HStack>
      <HStack>
        <Switch id={id} aria-labelledby={labelId} />
        <Label id={labelId} htmlFor={id}>
          Trail condition alerts
        </Label>
      </HStack>
      <HStack>
        <Switch id={disabledId} disabled />
        <Label htmlFor={disabledId}>Disabled alerts</Label>
      </HStack>
    </HStack>
  )
}

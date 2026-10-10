import { HStack } from "@registry/components/ui/hstack"
import { Label } from "@registry/components/ui/label"
import { Switch } from "@registry/components/ui/switch"
import { useId } from "react"

export function Preview() {
  const id = useId()

  const labelId = `${id}-label`

  return (
    <HStack>
      <Switch id={id} aria-labelledby={labelId} />
      <Label id={labelId} htmlFor={id}>
        Marketing emails
      </Label>
    </HStack>
  )
}

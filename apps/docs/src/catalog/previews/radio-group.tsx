import { Label } from "@registry/components/ui/label"
import { Radio, RadioGroup } from "@registry/components/ui/radio-group"

export function Preview() {
  return (
    <RadioGroup aria-label="Survey equipment" defaultValue="birdwatching">
      <Label>
        <Radio aria-label="Birdwatching" value="birdwatching" /> Birdwatching
      </Label>
      <Label>
        <Radio aria-label="Audio recording" value="audio" /> Audio recording
      </Label>
      <Label>
        <Radio aria-label="Trail mapping" value="mapping" /> Trail mapping
      </Label>
    </RadioGroup>
  )
}

import { Box } from "@registry/components/ui/box"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@registry/components/ui/select"

const items = [
  { label: "Birdwatching", value: "birdwatching" },
  { label: "Audio recording", value: "audio" },
  { label: "Trail mapping", value: "mapping" },
]

const portalProps = {
  render: <Box aria-label="Equipment options" render={<section />} />,
}

export function Preview() {
  return (
    <Select
      aria-label="Select equipment"
      defaultValue="birdwatching"
      items={items}
    >
      <SelectTrigger aria-label="Select equipment">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup portalProps={portalProps}>
        {items.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

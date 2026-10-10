import { Box } from "@registry/components/ui/box"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@registry/components/ui/select"

const items = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Astro", value: "astro" },
]

const portalProps = {
  render: <Box aria-label="Framework options" render={<section />} />,
}

export function Preview() {
  return (
    <Select aria-label="Select framework" defaultValue="next" items={items}>
      <SelectTrigger aria-label="Select framework">
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

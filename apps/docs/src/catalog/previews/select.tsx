import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const items = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Astro", value: "astro" },
]

export function Preview() {
  return (
    <Select aria-label="Select framework" defaultValue="next" items={items}>
      <SelectTrigger aria-label="Select framework">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const items = [
  { label: "Next.js", value: "next" },
  { label: "Vite", value: "vite" },
  { label: "Astro", value: "astro" },
]

export default function Example() {
  return (
    <Select aria-label="Select framework" defaultValue="next" items={items}>
      <SelectTrigger aria-label="Select framework">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup
        portalProps={{
          "aria-label": "Select framework options",
          role: "region",
        }}
      >
        {items.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

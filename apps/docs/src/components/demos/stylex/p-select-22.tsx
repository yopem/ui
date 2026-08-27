import * as stylex from "@stylexjs/stylex"

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

export default function Particle() {
  return (
    <Select aria-label="Select framework" defaultValue="next" items={items}>
      <SelectTrigger {...stylex.props(demoStyles.demo1)}>
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

const demoStyles = stylex.create({
  demo1: {
    borderColor: "transparent",
    backgroundColor: "var(--muted)",
    boxShadow: "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000",
    "::before": {
      content: '""',
      display: "none",
    },
  },
})

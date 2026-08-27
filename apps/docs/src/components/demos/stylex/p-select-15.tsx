import * as stylex from "@stylexjs/stylex"

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const items = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Archived", value: "archived" },
]

export default function Particle() {
  return (
    <Select aria-label="Select filter" defaultValue="active" items={items}>
      <SelectTrigger {...stylex.props(demoStyles.report1Manual)}>
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
  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999px",
    borderRadius: "9999px",
  },
})

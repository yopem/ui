import * as stylex from "@stylexjs/stylex"

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const items = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Archived", value: "archived" },
]

export default function Example() {
  return (
    <Select aria-label="Select filter" defaultValue="active" items={items}>
      <SelectTrigger
        {...stylex.props(exampleStyles.report1Manual)}
        aria-label="Select filter"
      >
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

const exampleStyles = stylex.create({
  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999px",
    borderRadius: "9999px",
  },
})

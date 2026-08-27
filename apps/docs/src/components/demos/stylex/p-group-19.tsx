import * as stylex from "@stylexjs/stylex"

import { Group, GroupSeparator } from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const domains = [
  { label: ".com", value: "com" },
  { label: ".org", value: "org" },
  { label: ".net", value: "net" },
]

export default function Particle() {
  return (
    <Group aria-label="Domain input">
      <Input aria-label="Domain name" placeholder="example" type="text" />
      <GroupSeparator />
      <Select defaultValue="com" items={domains}>
        <SelectTrigger {...stylex.props(demoStyles.selectTrigger)}>
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {domains.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </Group>
  )
}

const demoStyles = stylex.create({
  selectTrigger: { inlineSize: "fit-content", minInlineSize: 0 },
})

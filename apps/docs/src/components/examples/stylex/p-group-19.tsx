import * as stylex from "@stylexjs/stylex"

import { Group, GroupSeparator, groupItemStyles } from "@/components/ui/group"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const domains = [
  { label: ".com", value: "com" },
  { label: ".org", value: "org" },
  { label: ".net", value: "net" },
]

export default function Example() {
  return (
    <Group aria-label="Domain input">
      <Input
        aria-label="Domain name"
        placeholder="example"
        type="text"
        controlXstyle={groupItemStyles.item}
      />
      <GroupSeparator />
      <Select defaultValue="com" items={domains}>
        <SelectTrigger
          aria-label="Select domain suffix"
          xstyle={[groupItemStyles.item, exampleStyles.selectTrigger]}
        >
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

const exampleStyles = stylex.create({
  selectTrigger: { inlineSize: "fit-content", minInlineSize: 0 },
})

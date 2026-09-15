import * as stylex from "@stylexjs/stylex"

import {
  Group,
  GroupSeparator,
  groupItemStyles,
} from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const protocols = [
  { label: "https://", value: "https" },
  { label: "http://", value: "http" },
  { label: "ftp://", value: "ftp" },
  { label: "sftp://", value: "sftp" },
]

export default function Example() {
  return (
    <Group aria-label="URL input">
      <Select defaultValue="https" items={protocols}>
        <SelectTrigger
          xstyle={[groupItemStyles.item, exampleStyles.selectTrigger]}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {protocols.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <GroupSeparator />
      <Input
        aria-label="IP address"
        placeholder="192.168.1.1"
        type="text"
        controlXstyle={groupItemStyles.item}
      />
    </Group>
  )
}

const exampleStyles = stylex.create({
  selectTrigger: { inlineSize: "fit-content", minInlineSize: 0 },
})

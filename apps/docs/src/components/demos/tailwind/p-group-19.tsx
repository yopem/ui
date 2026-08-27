import { Group, GroupSeparator } from "@/components/ui/tailwind/group"
import { Input } from "@/components/ui/tailwind/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/tailwind/select"

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
        <SelectTrigger className="min-w-none w-fit">
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

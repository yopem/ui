import { Group, GroupSeparator } from "@/components/ui/tailwind/group"
import { Input } from "@/components/ui/tailwind/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/tailwind/select"

const protocols = [
  { label: "https://", value: "https" },
  { label: "http://", value: "http" },
  { label: "ftp://", value: "ftp" },
  { label: "sftp://", value: "sftp" },
]

export default function Particle() {
  return (
    <Group aria-label="URL input">
      <Select defaultValue="https" items={protocols}>
        <SelectTrigger className="min-w-none w-fit">
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
      <Input aria-label="IP address" placeholder="192.168.1.1" type="text" />
    </Group>
  )
}

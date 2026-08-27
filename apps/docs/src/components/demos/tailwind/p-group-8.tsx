import {
  Group,
  GroupSeparator,
  GroupText,
} from "@/components/ui/tailwind/group"
import { Input } from "@/components/ui/tailwind/input"
import { Label } from "@/components/ui/tailwind/label"

export default function Particle() {
  return (
    <Group aria-label="Domain input">
      <Input
        aria-label="Domain"
        defaultValue="coss"
        id="domain-suffix"
        type="text"
      />
      <GroupSeparator />
      <GroupText
        render={<Label aria-label="Domain suffix" htmlFor="domain-suffix" />}
      >
        .com
      </GroupText>
    </Group>
  )
}

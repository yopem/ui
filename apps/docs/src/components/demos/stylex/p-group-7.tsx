import { Group, GroupSeparator, GroupText } from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import { Label } from "@/components/ui/stylex/label"

export default function Particle() {
  return (
    <Group aria-label="Domain input">
      <GroupText render={<Label aria-label="Domain" htmlFor="domain" />}>
        https://
      </GroupText>
      <GroupSeparator />
      <Input
        aria-label="Domain"
        defaultValue="coss.com"
        id="domain"
        type="text"
      />
    </Group>
  )
}

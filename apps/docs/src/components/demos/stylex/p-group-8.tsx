import {
  Group,
  GroupSeparator,
  GroupText,
  groupItemStyles,
} from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import { Label } from "@/components/ui/stylex/label"

export default function Particle() {
  return (
    <Group aria-label="Domain input">
      <Input
        aria-label="Domain"
        defaultValue="coss"
        id="domain-suffix"
        type="text"
        controlXstyle={groupItemStyles.item}
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

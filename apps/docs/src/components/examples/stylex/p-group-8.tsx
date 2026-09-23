import {
  Group,
  GroupSeparator,
  GroupText,
  groupItemStyles,
} from "@/components/ui/group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Example() {
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

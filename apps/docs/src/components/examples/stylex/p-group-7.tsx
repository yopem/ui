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
      <GroupText render={<Label aria-label="Domain" htmlFor="domain" />}>
        https://
      </GroupText>
      <GroupSeparator />
      <Input
        aria-label="Domain"
        defaultValue="coss.com"
        id="domain"
        type="text"
        controlXstyle={groupItemStyles.item}
      />
    </Group>
  )
}

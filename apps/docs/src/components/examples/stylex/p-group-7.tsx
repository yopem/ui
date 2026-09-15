import {
  Group,
  GroupSeparator,
  GroupText,
  groupItemStyles,
} from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import { Label } from "@/components/ui/stylex/label"

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

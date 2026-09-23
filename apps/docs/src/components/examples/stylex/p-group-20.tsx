import { Button } from "@/components/ui/button"
import { Group, GroupSeparator, groupItemStyles } from "@/components/ui/group"
import { Input } from "@/components/ui/input"

export default function Example() {
  return (
    <Group aria-label="Email subscription">
      <Input
        aria-label="Email"
        placeholder="Email"
        type="email"
        controlXstyle={groupItemStyles.item}
      />
      <GroupSeparator />
      <Button variant="outline" xstyle={groupItemStyles.item}>
        Subscribe
      </Button>
    </Group>
  )
}

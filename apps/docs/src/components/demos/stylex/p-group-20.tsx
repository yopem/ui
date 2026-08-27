import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"

export default function Particle() {
  return (
    <Group aria-label="Email subscription">
      <Input aria-label="Email" placeholder="Email" type="email" />
      <GroupSeparator />
      <Button variant="outline">Subscribe</Button>
    </Group>
  )
}

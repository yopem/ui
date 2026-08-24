import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"
import { Group, GroupSeparator } from "@/components/ui/tailwind/group"
import { Input } from "@/components/ui/tailwind/input"

export default function Particle() {
  return (
    <Group aria-label="Add item">
      <Button aria-label="Add" size="icon" variant="outline">
        <PlusIcon aria-hidden="true" />
      </Button>
      <GroupSeparator />
      <Input aria-label="Item name" placeholder="Enter item name" type="text" />
    </Group>
  )
}

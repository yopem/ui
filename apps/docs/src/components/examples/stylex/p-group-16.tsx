import * as stylex from "@stylexjs/stylex"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Group, GroupSeparator, groupItemStyles } from "@/components/ui/group"
import { Input } from "@/components/ui/input"

export default function Example() {
  return (
    <Group aria-label="Add item">
      <Button
        aria-label="Add"
        size="icon"
        variant="outline"
        xstyle={groupItemStyles.item}
      >
        <PlusIcon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
      </Button>
      <GroupSeparator />
      <Input
        aria-label="Item name"
        placeholder="Enter item name"
        type="text"
        controlXstyle={groupItemStyles.item}
      />
    </Group>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
})

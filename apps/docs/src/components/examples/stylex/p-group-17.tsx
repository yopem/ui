import * as stylex from "@stylexjs/stylex"

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
    <Group aria-label="Price input">
      <Input
        aria-label="Enter the amount"
        defaultValue="100"
        id="amount"
        type="text"
        controlXstyle={groupItemStyles.item}
        xstyle={exampleStyles.example1}
      />
      <GroupSeparator />
      <GroupText render={<Label aria-label="Currency" htmlFor="amount" />}>
        USD
      </GroupText>
    </Group>
  )
}

const exampleStyles = stylex.create({
  example1: {
    textAlign: "right",
  },
})

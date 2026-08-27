import * as stylex from "@stylexjs/stylex"

import { Group, GroupSeparator, GroupText } from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import { Label } from "@/components/ui/stylex/label"

export default function Particle() {
  return (
    <Group aria-label="Price input">
      <Input
        aria-label="Enter the amount"
        {...stylex.props(demoStyles.demo1)}
        defaultValue="100"
        id="amount"
        type="text"
      />
      <GroupSeparator />
      <GroupText render={<Label aria-label="Currency" htmlFor="amount" />}>
        USD
      </GroupText>
    </Group>
  )
}

const demoStyles = stylex.create({
  demo1: {
    textAlign: "right",
  },
})

import * as stylex from "@stylexjs/stylex"

import { Group, GroupSeparator } from "@/components/ui/stylex/group"
import { Label } from "@/components/ui/stylex/label"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Label>Range</Label>
      <Group aria-label="Range input">
        <NumberField aria-label="Min value" render={<NumberFieldGroup />}>
          <NumberFieldInput
            {...stylex.props(demoStyles.demo2)}
            placeholder="From"
          />
        </NumberField>
        <GroupSeparator />
        <NumberField aria-label="Max value" render={<NumberFieldGroup />}>
          <NumberFieldInput
            {...stylex.props(demoStyles.demo2)}
            placeholder="To"
          />
        </NumberField>
      </Group>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    textAlign: "left",
  },
})

import * as stylex from "@stylexjs/stylex"

import { Flex } from "@/components/ui/flex"
import { Group, GroupSeparator, groupItemStyles } from "@/components/ui/group"
import { Label } from "@/components/ui/label"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/number-field"
export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Label>Range</Label>
      <Group aria-label="Range input">
        <NumberField
          aria-label="Min value"
          render={<NumberFieldGroup xstyle={groupItemStyles.item} />}
        >
          <NumberFieldInput
            placeholder="From"
            xstyle={exampleStyles.example2}
          />
        </NumberField>
        <GroupSeparator />
        <NumberField
          aria-label="Max value"
          render={<NumberFieldGroup xstyle={groupItemStyles.item} />}
        >
          <NumberFieldInput placeholder="To" xstyle={exampleStyles.example2} />
        </NumberField>
      </Group>
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    textAlign: "left",
  },
})

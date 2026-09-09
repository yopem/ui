"use client"

import * as stylex from "@stylexjs/stylex"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Group,
  GroupSeparator,
  groupItemStyles,
} from "@/components/ui/stylex/group"
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/stylex/number-field"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

interface Currency {
  value: string
  label: string
}

const currencies: Currency[] = [
  {
    label: "US Dollar",
    value: "$",
  },
  {
    label: "Euro",
    value: "€",
  },
  {
    label: "British Pound",
    value: "£",
  },
]

export default function Particle() {
  return (
    <Group aria-label="Payment amount">
      <Group aria-label="Amount input">
        <Select
          defaultValue={currencies[0]}
          itemToStringValue={(currency) => currency.value}
        >
          <SelectTrigger
            xstyle={[groupItemStyles.item, demoStyles.selectTrigger]}
          >
            <SelectValue>{(currency: Currency) => currency.value}</SelectValue>
          </SelectTrigger>
          <SelectPopup xstyle={demoStyles.demo1}>
            {currencies.map((curr) => (
              <SelectItem key={curr.value} value={curr}>
                {curr.value}{" "}
                <span {...stylex.props(demoStyles.demo2)}>{curr.label}</span>
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        <GroupSeparator />
        <NumberField
          aria-label="Enter the amount"
          defaultValue={10}
          render={<NumberFieldGroup xstyle={groupItemStyles.item} />}
          xstyle={demoStyles.demo3}
        >
          <NumberFieldInput xstyle={demoStyles.demo4} />
        </NumberField>
      </Group>
      <Group aria-label="Submit">
        <Button
          aria-label="Send"
          size="icon"
          variant="outline"
          xstyle={groupItemStyles.item}
        >
          <ArrowRightIcon
            aria-hidden="true"
            {...stylex.props(demoStyles.icon)}
          />
        </Button>
      </Group>
    </Group>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  selectTrigger: { inlineSize: "fit-content", minInlineSize: 0 },
  demo1: {
    minInlineSize: "calc(0.25rem * 48)",
  },
  demo2: {
    marginInlineStart: "0.25rem",
  },
  demo3: {
    gap: "0px",
  },
  demo4: {
    textAlign: "left",
  },
})

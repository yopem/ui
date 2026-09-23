"use client"

import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const items = [
  {
    description: "Ideal for individuals",
    label: "Standard Plan",
    value: "standard",
  },
  { description: "For professional users", label: "Pro Plan", value: "pro" },
  {
    description: "Built for large teams",
    label: "Enterprise Plan",
    value: "enterprise",
  },
]

export default function Example() {
  return (
    <Select
      aria-label="Select plan"
      defaultValue={items[1]}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger aria-label="Select plan">
        <SelectValue>
          {(item) => (
            <Box as="span" {...stylex.props(exampleStyles.example1)}>
              {item.label}
            </Box>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item}>
            <Box as="span" {...stylex.props(exampleStyles.example2)}>
              <Box as="span" {...stylex.props(exampleStyles.example1)}>
                {item.label}
              </Box>
              <Box as="span" {...stylex.props(exampleStyles.example3)}>
                {item.description}
              </Box>
            </Box>
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

const exampleStyles = stylex.create({
  example1: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
  },
  example3: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})

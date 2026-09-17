"use client"

import * as stylex from "@stylexjs/stylex"

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

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
            <span {...stylex.props(exampleStyles.example1)}>{item.label}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item}>
            <span {...stylex.props(exampleStyles.example2)}>
              <span {...stylex.props(exampleStyles.example1)}>
                {item.label}
              </span>
              <span {...stylex.props(exampleStyles.example3)}>
                {item.description}
              </span>
            </span>
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

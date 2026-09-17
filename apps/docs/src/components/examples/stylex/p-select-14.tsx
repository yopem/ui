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
  { color: "emerald", label: "Completed", value: "completed" },
  { color: "blue", label: "In Progress", value: "in-progress" },
  { color: "amber", label: "Pending", value: "pending" },
  { color: "gray", label: "Cancelled", value: "cancelled" },
  { color: "red", label: "Failed", value: "failed" },
] as const

export default function Example() {
  return (
    <Select
      aria-label="Select status"
      defaultValue={items[0]}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger aria-label="Select status">
        <SelectValue>
          {(item) => (
            <span {...stylex.props(exampleStyles.example1)}>
              <span
                aria-hidden="true"
                {...stylex.props(exampleStyles.dot, getColorStyle(item.color))}
              />
              <span {...stylex.props(exampleStyles.example2)}>
                {item.label}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value} value={item}>
            <span {...stylex.props(exampleStyles.example1)}>
              <span
                aria-hidden="true"
                {...stylex.props(exampleStyles.dot, getColorStyle(item.color))}
              />
              <span {...stylex.props(exampleStyles.example2)}>
                {item.label}
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
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  dot: {
    blockSize: "0.5rem",
    borderRadius: "9999px",
    inlineSize: "0.5rem",
  },
  emerald: { backgroundColor: "oklch(69.6% 0.17 162.48)" },
  blue: { backgroundColor: "oklch(62.3% 0.214 259.815)" },
  amber: { backgroundColor: "oklch(76.9% 0.188 70.08)" },
  gray: { backgroundColor: "oklch(55.1% 0.027 264.364)" },
  red: { backgroundColor: "oklch(63.7% 0.237 25.331)" },
  example2: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})

function getColorStyle(color: (typeof items)[number]["color"]) {
  switch (color) {
    case "amber":
      return exampleStyles.amber
    case "blue":
      return exampleStyles.blue
    case "emerald":
      return exampleStyles.emerald
    case "gray":
      return exampleStyles.gray
    case "red":
      return exampleStyles.red
  }
}

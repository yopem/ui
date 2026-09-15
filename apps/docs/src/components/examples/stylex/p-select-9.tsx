"use client"

import * as stylex from "@stylexjs/stylex"
import { Code2Icon, GlobeIcon, LayersIcon, ZapIcon } from "lucide-react"

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const items = [
  { icon: LayersIcon, label: "Components", value: "components" },
  { icon: ZapIcon, label: "Performance", value: "performance" },
  { icon: GlobeIcon, label: "Network", value: "network" },
  { icon: Code2Icon, label: "Development", value: "development" },
]

export default function Example() {
  return (
    <Select
      aria-label="Select category"
      defaultValue={items[0]}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger>
        <SelectValue>
          {(item) => (
            <span {...stylex.props(exampleStyles.example1)}>
              <item.icon {...stylex.props(exampleStyles.icon)} />
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
              <item.icon {...stylex.props(exampleStyles.icon)} />
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
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  example1: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})

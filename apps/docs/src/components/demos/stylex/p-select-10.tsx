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
  { description: "npx create-next-app", label: "Next.js", value: "next" },
  { description: "npm create vite@latest", label: "Vite", value: "vite" },
  { description: "npm create astro@latest", label: "Astro", value: "astro" },
  { description: "npx create-remix", label: "Remix", value: "remix" },
]

export default function Particle() {
  return (
    <Select
      aria-label="Select framework with command"
      defaultValue={items[0]}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger {...stylex.props(demoStyles.demo1)}>
        <SelectValue>
          {(item) => (
            <span {...stylex.props(demoStyles.demo2)}>
              <span {...stylex.props(demoStyles.demo3)}>{item.label}</span>
              <span {...stylex.props(demoStyles.demo4)}>
                {item.description}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value} value={item}>
            <span {...stylex.props(demoStyles.demo2)}>
              <span {...stylex.props(demoStyles.demo3)}>{item.label}</span>
              <span {...stylex.props(demoStyles.demo4)}>
                {item.description}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

const demoStyles = stylex.create({
  demo1: {
    paddingBlock: "0.25rem",
  },
  demo2: {
    display: "flex",
    flexDirection: "column",
  },
  demo3: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  demo4: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})

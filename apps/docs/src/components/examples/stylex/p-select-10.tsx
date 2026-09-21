"use client"

import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/stylex/box"
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

export default function Example() {
  return (
    <Select
      aria-label="Select framework with command"
      defaultValue={items[0]}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger
        {...stylex.props(exampleStyles.example1)}
        aria-label="Select framework with command"
      >
        <SelectValue>
          {(item) => (
            <Box as="span" {...stylex.props(exampleStyles.example2)}>
              <Box as="span" {...stylex.props(exampleStyles.example3)}>
                {item.label}
              </Box>
              <Box as="span" {...stylex.props(exampleStyles.example4)}>
                {item.description}
              </Box>
            </Box>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value} value={item}>
            <Box as="span" {...stylex.props(exampleStyles.example2)}>
              <Box as="span" {...stylex.props(exampleStyles.example3)}>
                {item.label}
              </Box>
              <Box as="span" {...stylex.props(exampleStyles.example4)}>
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
    paddingBlock: "0.25rem",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
  },
  example3: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  example4: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
})

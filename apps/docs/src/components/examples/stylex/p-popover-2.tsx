"use client"

import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Example() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open Popover
      </PopoverTrigger>
      <PopoverPopup {...stylex.props(exampleStyles.example1)}>
        <PopoverClose
          aria-label="Close"
          {...stylex.props(exampleStyles.example2)}
          render={<Button size="icon" variant="ghost" />}
        >
          <XIcon {...stylex.props(exampleStyles.icon)} />
        </PopoverClose>
        <div {...stylex.props(exampleStyles.example3)}>
          <PopoverTitle {...stylex.props(exampleStyles.example4)}>
            Notifications
          </PopoverTitle>
          <PopoverDescription>
            You are all caught up. Good job!
          </PopoverDescription>
        </div>
        <PopoverClose render={<Button variant="outline" />}>Close</PopoverClose>
      </PopoverPopup>
    </Popover>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    inlineSize: "calc(0.25rem * 80)",
  },
  example2: {
    position: "absolute",
    insetInlineEnd: "calc(0.25rem * 2)",
    insetBlockStart: "calc(0.25rem * 2)",
  },
  example3: {
    marginBlockEnd: "calc(0.25rem * 2)",
  },
  example4: {
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
  },
})

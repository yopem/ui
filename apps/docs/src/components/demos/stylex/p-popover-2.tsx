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

export default function Particle() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open Popover
      </PopoverTrigger>
      <PopoverPopup {...stylex.props(demoStyles.demo1)}>
        <PopoverClose
          aria-label="Close"
          {...stylex.props(demoStyles.demo2)}
          render={<Button size="icon" variant="ghost" />}
        >
          <XIcon {...stylex.props(demoStyles.icon)} />
        </PopoverClose>
        <div {...stylex.props(demoStyles.demo3)}>
          <PopoverTitle {...stylex.props(demoStyles.demo4)}>
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

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    inlineSize: "calc(0.25rem * 80)",
  },
  demo2: {
    position: "absolute",
    insetInlineEnd: "calc(0.25rem * 2)",
    insetBlockStart: "calc(0.25rem * 2)",
  },
  demo3: {
    marginBlockEnd: "calc(0.25rem * 2)",
  },
  demo4: {
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
  },
})
